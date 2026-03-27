import { redirect } from "next/navigation";

export default function RedirectToHub() {
    redirect("/admin/control-center?tab=curation");
}
