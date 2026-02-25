
import { ZavvyLogo } from "@/components/ui/logo";
import { Card } from "@/components/ui/card";

export default function BrandKit() {
    return (
        <div className="container py-20 space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Brand Identity</h1>
                <p className="text-muted-foreground">Generated Vector Assets</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Card 1: Icon Only */}
                <Card className="p-12 flex flex-col items-center gap-6">
                    <h3 className="font-semibold text-muted-foreground">App Icon</h3>
                    <div className="p-8 border border-dashed rounded-xl">
                        <ZavvyLogo variant="icon" />
                    </div>
                </Card>

                {/* Card 2: Light Mode Full */}
                <Card className="p-12 flex flex-col items-center gap-6 bg-white">
                    <h3 className="font-semibold text-muted-foreground">Primary (Light)</h3>
                    <div className="p-8 border border-dashed rounded-xl">
                        <ZavvyLogo variant="full" theme="light" />
                    </div>
                </Card>

                {/* Card 3: Dark Mode Full */}
                <Card className="p-12 flex flex-col items-center gap-6 bg-black">
                    <h3 className="font-semibold text-white/60">Primary (Dark)</h3>
                    <div className="p-8 border border-white/20 border-dashed rounded-xl">
                        <ZavvyLogo variant="full" theme="dark" />
                    </div>
                </Card>
            </div>
        </div>
    );
}
