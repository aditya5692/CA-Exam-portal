
import os

root = r"c:\Users\asus\Downloads\Aditya\CA Exam portal"
for dirpath, dirnames, filenames in os.walk(root):
    if ".prisma" in dirnames:
        print(os.path.join(dirpath, ".prisma"))
