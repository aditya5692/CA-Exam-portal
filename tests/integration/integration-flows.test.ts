import assert from "node:assert/strict";
import test from "node:test";

import prisma from "@/lib/prisma/client";
import {
    authenticateUserRecord,
    registerUserRecord,
} from "@/lib/server/auth-management";
import {
    createBatchAnnouncements,
    createManagedBatch,
    joinStudentToBatchByCode,
    upsertBatchEnrollment,
} from "@/lib/server/batch-management";
import {
    listStudentVisibleExams,
    publishExamQuestions,
} from "@/lib/server/exam-publishing";
import {
    getExamAttemptResultsRecord,
    startExamAttemptRecord,
    submitExamAttemptRecord,
} from "@/lib/server/exam-workflow";
import { saveLearningProgressForExam } from "@/lib/server/learning-progress";
import {
    createSharedTeacherMaterial,
    deleteStudyMaterialWithAccessCleanup,
} from "@/lib/server/study-material-service";
import {
    countRows,
    createTestUser,
    disconnectIntegrationDatabase,
    resetIntegrationDatabase,
} from "./database-test-utils";

test.beforeEach(async () => {
    await resetIntegrationDatabase();
});

test.after(async () => {
    await disconnectIntegrationDatabase();
});

test("register and authenticate user records against PostgreSQL", async () => {
    const registered = await registerUserRecord({
        fullName: "  Integration Student  ",
        email: "  Student.Integration@Example.com ",
        registrationNumber: "  integ001 ",
        department: " CA Inter ",
        role: "student",
        password: "SecurePass123!",
    });

    assert.equal(registered.redirectTo, "/student/dashboard");
    assert.equal(registered.user.registrationNumber, "INTEG001");
    assert.equal(registered.user.email, "student.integration@example.com");
    assert.notEqual(registered.user.passwordHash, "SecurePass123!");

    const authenticated = await authenticateUserRecord({
        identifier: " student.integration@example.com ",
        password: "SecurePass123!",
        role: "STUDENT",
    });

    assert.equal(authenticated.user.id, registered.user.id);
    assert.equal(authenticated.redirectTo, "/student/dashboard");

    await prisma.user.update({
        where: { id: registered.user.id },
        data: {
            isBlocked: true,
            blockedReason: "Blocked by integration test",
        },
    });

    await assert.rejects(
        () =>
            authenticateUserRecord({
                identifier: "INTEG001",
                password: "SecurePass123!",
                role: "STUDENT",
            }),
        /Blocked by integration test/,
    );
});

test("batch joins and announcements persist correctly", async () => {
    const teacher = await createTestUser({ role: "TEACHER", fullName: "Teacher Batch" });
    const student = await createTestUser({ role: "STUDENT", fullName: "Student Batch" });

    const batch = await createManagedBatch({
        name: "November Tax Batch",
        teacherId: teacher.id,
        uniqueJoinCodeInput: " tax2026 ",
    });

    assert.equal(batch.uniqueJoinCode, "TAX2026");

    const enrollment = await joinStudentToBatchByCode(student.id, batch.uniqueJoinCode);
    assert.equal(enrollment.id, batch.id);

    await assert.rejects(
        () => joinStudentToBatchByCode(student.id, batch.uniqueJoinCode),
        /already enrolled/i,
    );

    const announcements = await createBatchAnnouncements({
        authorId: teacher.id,
        content: "Mock test released for this weekend.",
        batchIds: [batch.id],
    });

    assert.equal(announcements.length, 1);
    assert.equal(announcements[0].batchId, batch.id);

    const counts = await countRows();
    assert.equal(counts.batchCount, 1);
    assert.equal(counts.enrollmentCount, 1);
});

test("publishing a batch exam controls visibility and attempt lifecycle", async () => {
    const teacher = await createTestUser({ role: "TEACHER", fullName: "Teacher Exam" });
    const student = await createTestUser({ role: "STUDENT", fullName: "Student Exam" });
    const outsider = await createTestUser({ role: "STUDENT", fullName: "Outsider Exam" });
    const batch = await createManagedBatch({
        name: "Audit Fast Track",
        teacherId: teacher.id,
        uniqueJoinCodeInput: "audit-fast",
    });

    await upsertBatchEnrollment(student.id, batch.id);

    const published = await publishExamQuestions(teacher, {
        title: "Audit Revision Test 1",
        caLevel: "ipc",
        subject: "Audit",
        chapter: "Standards on Auditing",
        durationMinutes: 45,
        examType: "RTP",
        target: { kind: "batch", batchId: batch.id },
        questions: [
            {
                prompt: "Which SA covers audit evidence?",
                options: ["SA 500", "SA 320", "SA 240", "SA 265"],
                correct: [0],
                subject: "Audit",
                topic: "Audit Evidence",
                difficulty: "MEDIUM",
                explanation: "SA 500 deals with audit evidence.",
            },
            {
                prompt: "Which SA deals with materiality?",
                options: ["SA 700", "SA 320", "SA 560", "SA 505"],
                correct: [1],
                subject: "Audit",
                topic: "Materiality",
                difficulty: "EASY",
                explanation: "SA 320 covers materiality in planning and performing an audit.",
            },
        ],
    });

    const visibleToStudent = await listStudentVisibleExams(student.id, "ipc");
    const visibleToOutsider = await listStudentVisibleExams(outsider.id, "ipc");

    assert.equal(visibleToStudent.length, 1);
    assert.equal(visibleToStudent[0].id, published.examId);
    assert.equal(visibleToOutsider.length, 0);

    const exam = await prisma.exam.findUniqueOrThrow({
        where: { id: published.examId },
        include: {
            questions: {
                orderBy: { order: "asc" },
                include: {
                    question: {
                        include: {
                            options: true,
                        },
                    },
                },
            },
        },
    });

    const attempt = await startExamAttemptRecord(exam.id, student.id, { enforceVisibility: true });
    const sameAttempt = await startExamAttemptRecord(exam.id, student.id, { enforceVisibility: true });

    assert.equal(sameAttempt.id, attempt.id);

    const firstQuestion = exam.questions[0];
    const secondQuestion = exam.questions[1];
    const firstCorrectOption = firstQuestion.question.options.find((option) => option.isCorrect);
    const secondWrongOption = secondQuestion.question.options.find((option) => !option.isCorrect);

    assert.ok(firstCorrectOption);
    assert.ok(secondWrongOption);

    const submitted = await submitExamAttemptRecord(attempt.id, [
        {
            questionId: firstQuestion.questionId,
            selectedOptionId: firstCorrectOption.id,
            timeSpent: 35,
        },
        {
            questionId: secondQuestion.questionId,
            selectedOptionId: secondWrongOption.id,
            timeSpent: 41,
        },
    ]);

    assert.equal(submitted.status, "SUBMITTED");
    assert.equal(submitted.score, 1);

    const results = await getExamAttemptResultsRecord(attempt.id);
    assert.equal(results.score, 1);
    assert.equal(results.answers.length, 2);
    assert.equal(results.answers.filter((answer) => answer.isCorrect).length, 1);
});

test("learning progression remains idempotent for the same submitted attempt", async () => {
    const teacher = await createTestUser({ role: "TEACHER", fullName: "Teacher Learning" });
    const student = await createTestUser({ role: "STUDENT", fullName: "Student Learning" });

    const published = await publishExamQuestions(teacher, {
        title: "Direct Tax Drill",
        caLevel: "ipc",
        subject: "Direct Tax",
        chapter: "Residential Status",
        durationMinutes: 30,
        examType: "MTP",
        target: { kind: "all" },
        questions: [
            {
                prompt: "Residential status is determined for which period?",
                options: ["Calendar year", "Previous year", "Assessment year", "Financial statement year"],
                correct: [1],
                subject: "Direct Tax",
                topic: "Residential Status",
                difficulty: "MEDIUM",
                explanation: "It is determined for the previous year.",
            },
            {
                prompt: "Which income is taxable for an ROR?",
                options: ["Only Indian income", "Only foreign income", "Global income", "No income"],
                correct: [2],
                subject: "Direct Tax",
                topic: "Scope of Total Income",
                difficulty: "MEDIUM",
                explanation: "ROR is taxable on global income.",
            },
        ],
    });

    const exam = await prisma.exam.findUniqueOrThrow({
        where: { id: published.examId },
        include: {
            questions: {
                orderBy: { order: "asc" },
                include: {
                    question: {
                        include: {
                            options: true,
                        },
                    },
                },
            },
        },
    });

    const attempt = await startExamAttemptRecord(exam.id, student.id);
    const answers = exam.questions.map((examQuestion) => {
        const correctOption = examQuestion.question.options.find((option) => option.isCorrect);
        assert.ok(correctOption);

        return {
            questionId: examQuestion.questionId,
            selectedOptionId: correctOption.id,
            timeSpent: 28,
        };
    });

    await submitExamAttemptRecord(attempt.id, answers);

    const results = await getExamAttemptResultsRecord(attempt.id);
    const questionResults = results.answers.map((answer) => ({
        questionId: answer.questionId,
        subject: answer.question.subject ?? "General",
        topic: answer.question.topic ?? "General",
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent,
        selectedOptionId: answer.selectedOptionId,
    }));

    const firstSave = await saveLearningProgressForExam(student.id, exam.id, attempt.id, questionResults);
    const secondSave = await saveLearningProgressForExam(student.id, exam.id, attempt.id, questionResults);

    assert.equal(firstSave.xpGained > 0, true);
    assert.equal(firstSave.newLevel >= 1, true);
    assert.equal(secondSave.xpGained, 0);

    const xpEvents = await prisma.xPEvent.count({
        where: {
            studentId: student.id,
            reason: "EXAM_COMPLETED",
        },
    });
    assert.equal(xpEvents, 1);
});

test("teacher material distribution updates access and storage counters transactionally", async () => {
    const teacher = await createTestUser({
        role: "TEACHER",
        fullName: "Teacher Material",
        storageLimit: 5_000,
    });
    const student = await createTestUser({ role: "STUDENT", fullName: "Student Material" });
    const batch = await createManagedBatch({
        name: "GST Premium Batch",
        teacherId: teacher.id,
        uniqueJoinCodeInput: "gst-premium",
    });

    await upsertBatchEnrollment(student.id, batch.id);

    const material = await createSharedTeacherMaterial({
        actor: teacher,
        ownerId: teacher.id,
        title: "GST Quick Revision",
        fileUrl: "/uploads/teacher_materials/gst-revision.pdf",
        fileType: "application/pdf",
        fileSize: 1_024,
        isProtected: true,
        isPublic: false,
        batchIds: [batch.id],
        studentEmails: [],
    });

    const accesses = await prisma.materialAccess.findMany({
        where: { materialId: material.id },
        orderBy: { grantedAt: "asc" },
    });
    const ownerAfterCreate = await prisma.user.findUniqueOrThrow({
        where: { id: teacher.id },
        select: { storageUsed: true },
    });

    assert.equal(accesses.length, 1);
    assert.equal(accesses[0].studentId, student.id);
    assert.equal(ownerAfterCreate.storageUsed, 1_024);

    await deleteStudyMaterialWithAccessCleanup(material.id);

    const ownerAfterDelete = await prisma.user.findUniqueOrThrow({
        where: { id: teacher.id },
        select: { storageUsed: true },
    });
    const remainingMaterial = await prisma.studyMaterial.findUnique({
        where: { id: material.id },
    });
    const remainingAccessCount = await prisma.materialAccess.count({
        where: { materialId: material.id },
    });

    assert.equal(ownerAfterDelete.storageUsed, 0);
    assert.equal(remainingMaterial, null);
    assert.equal(remainingAccessCount, 0);
});
