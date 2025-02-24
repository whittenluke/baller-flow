// This is a server component
import { LevelEditorClient } from '@/components/LevelEditorClient';

// Server-side static params generation
export function generateStaticParams() {
    return Array.from({ length: 10 }, (_, i) => ({
        levelId: (i + 1).toString()
    }));
}

export default function LevelEditorPage({ params }: { params: { levelId: string } }) {
    return <LevelEditorClient levelId={params.levelId} />;
} 