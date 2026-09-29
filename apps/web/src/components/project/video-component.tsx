"use client";

interface VideoComponentProps {
  fileName: string;
  title: string;
}

const VideoComponent = ({ fileName, title }: VideoComponentProps) => (
  <video
    src={fileName}
    autoPlay
    muted
    loop
    playsInline
    aria-label={`Preview of ${title}`}
    className="size-full rounded-lg object-cover"
    preload="metadata"
  />
);

export default VideoComponent;
