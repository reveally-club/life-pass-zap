import React, { useState } from "react";
import { useRouter } from "next/router";
import { fireStorage, fireStore } from "@/modules/firebase";
import { ref } from "firebase/storage";
import { useUploadFile } from "react-firebase-hooks/storage";
import dayjs from "dayjs";

import Swal from "sweetalert2";
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";

export default function Camera() {
  const router = useRouter();
  const storageRef = ref(
    fireStorage,
    `season-test/test-${dayjs().format("YYYY-MM-DD HH:mm:ss")}.jpg`
  );

  const [uploadFile] = useUploadFile();
  const [selectedFile, setSelectedFile] = useState<File>();
  const [capturedImage, setCapturedImage] = useState("");

  const wrapText = (
    context: {
      measureText: (arg0: string) => any;
      fillText: (arg0: string, arg1: any, arg2: any) => void;
    },
    text: string,
    x: any,
    y: any,
    maxWidth: number,
    lineHeight: any
  ) => {
    const words = text.split(" ");
    let line = "";
    let lineNumber = 0;

    for (const word of words) {
      const testLine = line + word + " ";
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && line.length > 0) {
        context.fillText(line, x, y);
        line = word + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }

    context.fillText(line, x, y);
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : undefined;
    setSelectedFile(file);

    if (file && file instanceof Blob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const img = new Image();
        img.src = reader!.result as string;

        img.onload = async () => {
          createImageBitmap(img).then(async (bitmap) => {
            const MAX_CANVAS_WIDTH = 512;
            const MAX_CANVAS_HEIGHT = 512;

            const ratio = Math.min(
              MAX_CANVAS_WIDTH / bitmap.width,
              MAX_CANVAS_HEIGHT / bitmap.height
            );

            const canvasWidth = bitmap.width * ratio;
            const canvasHeight = bitmap.height * ratio;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            if (ctx) {
              ctx.drawImage(bitmap, 0, 0, canvasWidth, canvasHeight);

              const time = dayjs().format("YYYY.MM.DD");
              const message = await getRandomMessage();
              ctx.font = `${Math.floor(canvas.width / 20)}px Courier New`;
              ctx.fillStyle = "white";
              ctx.textAlign = "center";
              const maxWidth = canvas.width * 0.8;
              const lineHeight = Math.floor(canvas.width / 20);
              const wrappedText = `🎫 ${message}\n ${time}`;
              const x = canvas.width / 2;
              const y = canvas.height - lineHeight * 2;

              wrapText(ctx, wrappedText, x, y, maxWidth, lineHeight);

              setCapturedImage(canvas.toDataURL());
            }
          });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async () => {
    if (selectedFile) {
      const blob = await fetch(capturedImage).then((res) => res.blob());
      const image = await uploadFile(storageRef, blob, {
        contentType: "image/jpeg",
      });

      const data = {
        photo: image?.metadata.fullPath,
        support: 0,
        tagList: ["🎫시즌1", "🌄기상인증"],
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        user: {
          displayName: "test",
          uid: "test",
        },
      };

      const season = doc(collection(fireStore, "season-test"));
      await setDoc(season, data);
    }
  };

  const getRandomMessage = async () => {
    const collectionRef = collection(fireStore, "watermark");
    const querySnapshot = await getDocs(collectionRef);
    const totalMessages = querySnapshot.docs.length;

    if (totalMessages === 0) {
      return "No messages available.";
    }

    const randomIndex = Math.floor(Math.random() * totalMessages);
    const randomMessageDoc = querySnapshot.docs[randomIndex];
    const message = randomMessageDoc.data().message;

    return message;
  };

  const dataURLToBlob = (dataURL: string) => {
    const BASE64_MARKER = ";base64,";
    const parts = dataURL.split(BASE64_MARKER);
    const contentType = parts[0].split(":")[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
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
              onSubmit();
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
                    const imageBlob = dataURLToBlob(capturedImage);
                    const fileName = "life-pass.png";
                    const file = new File([imageBlob], fileName, {
                      type: "image/png",
                    });

                    const filesArray = [file];

                    navigator.share({
                      files: filesArray,
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
        <label className="w-full flex justify-center cursor-pointer rounded-lg py-3 font-semibold text-gray-800  bg-gradient-to-r from-sky-200 to-violet-200 hover:from-sky-300 hover:to-violet-300">
          📸 갓생 인증하기
          <input
            required
            id="pass-file"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCapture}
          />
        </label>
      )}
    </div>
  );
}
