import type { Metadata } from "next";

import { AdminUpload } from "@/components/pins/admin-upload";

export const metadata: Metadata = {
    title: "Upload pins",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <AdminUpload />;
}
