"use client";
import Image from "next/image";
import type { FC } from "react";
import { motion } from "motion/react";

interface PolaroidPhotoProps {
    imageSrc: string;
    altText: string;
    text?: string;
    rotation?: number;
}

const PolaroidPhoto: FC<PolaroidPhotoProps> = ({
    imageSrc,
    altText,
    text = "",
    rotation = 6,
}) => {
    return (
        <motion.div
            initial={{
                filter: "blur(1px)",
                scale: 1.2,
                rotate: `${rotation}deg`,
            }}
            whileInView={{ filter: "blur(0px)", scale: 1 }}
            style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "center",
            }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, ease: "linear" }}
            className="polaroid group h-50 w-40 rounded-[1px] bg-white p-2 shadow-md transition-all duration-200 hover:scale-105 dark:shadow-md dark:shadow-emerald-900"
        >
            <Image
                width={300}
                height={250}
                alt={altText}
                src={imageSrc}
                className="size-40 object-cover grayscale transition-all delay-150 duration-300 group-hover:grayscale-0"
            />
            {text && (
                <p
                    className={
                        "mt-2 text-center font-medium text-black"
                    }
                >
                    {text}
                </p>
            )}
        </motion.div>
    );
};

export default PolaroidPhoto;
