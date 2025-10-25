import DailyReviewWorkflow from "@/components/daily-review/daily-review-workflow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DailyReviewPage() {
    return (
        <div className="mx-auto max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Daily Review</CardTitle>
                    <CardDescription>
                        A consistent rhythm of planning, execution, and analysis.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DailyReviewWorkflow />
                </CardContent>
            </Card>
        </div>
    );
}
