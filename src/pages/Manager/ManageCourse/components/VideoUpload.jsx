import { uploadVideoToCloudinary } from "@/api/cloudinaryApi";
import { createLesson } from "@/api/lessonApi";
import { useState } from "react";

const [file, setFile] = useState(null);

const handleFileChange = (e) => {
  setFile(e.target.files[0]);
};

const handleSubmit = async () => {
  if (!file) {
    alert("Vui lòng chọn video");
    return;
  }

  try {
    // 1️⃣ Upload lên Cloudinary
    const videoUrl = await uploadVideoToCloudinary(file);

    // 2️⃣ Gửi lên BE tạo lesson
    await createLesson({
      title,
      lessonType: "VIDEO",
      videoUrl,
      moduleId
    });

    alert("Tạo lesson thành công!");
  } catch (err) {
    console.error(err);
    alert("Có lỗi xảy ra!");
  }
};