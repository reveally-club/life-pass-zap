import dayjs from "dayjs";
import { useRouter } from "next/router";
import React, { useState } from "react";

import Swal from "sweetalert2";

export default function Camera() {
  const router = useRouter();
  const [capturedImage, setCapturedImage] = useState("");

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : undefined;

    if (file && file instanceof Blob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const img = new Image();
        img.src = reader!.result as string;

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;

          if (ctx) {
            ctx.drawImage(img, 0, 0);

            const time = dayjs().format("YYYY.MM.DD");
            ctx.font = "24px Courier New";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(
              `🎫 life.pass ${time}`,
              img.width / 2 - ctx.measureText(time).width,
              img.height - 40
            );

            setCapturedImage(canvas.toDataURL());
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full mt-8 mb-8 flex justify-center">
        {capturedImage && <img src={capturedImage} alt="갓생.인증" />}
      </div>
      {capturedImage ? (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => {
              Swal.fire({
                showCancelButton: true,
                icon: "success",
                title: "갓생.패쓰",
                confirmButtonText: "🔥 갓생.확인",
                confirmButtonColor: "#38bdf8",
                cancelButtonText: "📝 갓생.공유",
                cancelButtonColor: "#a78bfa",
              }).then((result) => {
                if (!result.isConfirmed) {
                  if (navigator.share) {
                    navigator.share({
                      title: "오늘도 갓생.패쓰 🎫",
                      text: "오늘도 갓생으로 성장한 하루 🔥",
                      url: "https://life.reveally.club",
                    });
                  } else {
                    Swal.fire({
                      icon: "error",
                      title: "오류",
                      text: "공유가 지원되지 않는 환경입니다.",
                      confirmButtonText: "확인",
                      confirmButtonColor: "#38bdf8",
                    });
                  }
                } else {
                  router.push("/history");
                }
              });
            }}
            className="w-full flex justify-center rounded-lg py-3 font-semibold text-gray-800  bg-gradient-to-r from-sky-200 to-violet-200 hover:from-sky-300 hover:to-violet-300"
          >
            👏 제출
          </button>
          <button
            onClick={() => {
              setCapturedImage("");
            }}
            className="w-full flex justify-center rounded-lg py-3 font-semibold text-gray-800  bg-gradient-to-r from-sky-50 to-violet-50 hover:from-sky-100 hover:to-violet-100"
          >
            📸 다른 사진으로 인증하기
          </button>
        </div>
      ) : (
        <label className="w-full flex justify-center rounded-lg py-3 font-semibold text-gray-800  bg-gradient-to-r from-sky-200 to-violet-200 hover:from-sky-300 hover:to-violet-300">
          📸 갓생 인증하기
          <input
            required
            id="pass-file"
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleCapture}
          />
        </label>
      )}
    </div>
  );
}
