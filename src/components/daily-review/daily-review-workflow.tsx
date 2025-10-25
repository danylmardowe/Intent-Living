"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { objectives, lifeAreas } from "@/lib/mock-data";
import { activityRecallWithNLP } from "@/ai/flows/activity-recall-with-nlp";
import { generateJournalingPrompts } from "@/ai/flows/personalized-journaling-prompts";
import { ArrowLeft, ArrowRight, Loader2, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

const totalSteps = 5;

type ParsedActivity = {
  activity: string;
  startTime?: string;
  duration?: string;
};

export default function DailyReviewWorkflow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [activityInput, setActivityInput] = useState("");
  const [parsedActivities, setParsedActivities] = useState<ParsedActivity[]>([]);

  const dailyObjectives = objectives.filter(o => o.cadence === 'daily' && o.status === 'active');
  const activeLifeAreas = lifeAreas.filter(la => la.journalingCadence === 'daily');

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGeneratePrompts = async () => {
    setIsLoading(true);
    try {
      const result = await generateJournalingPrompts({
        timeWindow: "daily",
        pastJournalEntries: ["Worked hard on the project", "Felt a bit tired"],
        activeTasks: ["Build UI for Eisenhower Matrix"],
        activeGoals: ["Implement Daily Review"],
        activeLifeAreas: ["Career & Work"],
      });
      setPrompts(result.prompts);
    } catch (error) {
      console.error("Failed to generate prompts:", error);
      // Fallback prompts
      setPrompts([
        "What did you accomplish today?",
        "What obstacles did you face?",
        "How can you improve tomorrow?",
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseActivities = async () => {
    if (!activityInput) return;
    setIsLoading(true);
    try {
      const result = await activityRecallWithNLP({ userInput: activityInput });
      setParsedActivities(result.structuredActivities);
    } catch (error) {
      console.error("Failed to parse activities:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h3 className="font-semibold text-lg">1. Objectives Workflow</h3>
            <p className="text-muted-foreground text-sm mb-4">Check off your active daily objectives.</p>
            <div className="space-y-3">
              {dailyObjectives.map(obj => (
                <div key={obj.id} className="flex items-center space-x-3">
                  <Checkbox id={`obj-${obj.id}`} />
                  <Label htmlFor={`obj-${obj.id}`} className="flex-1">{obj.title}</Label>
                </div>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h3 className="font-semibold text-lg">2. General Journaling</h3>
            <p className="text-muted-foreground text-sm mb-4">Reflect on your day and plan for tomorrow.</p>
            <Button onClick={handleGeneratePrompts} disabled={isLoading} size="sm" className="mb-4">
              <Wand2 className="mr-2 h-4 w-4" />
              {isLoading ? "Generating..." : "Generate Prompts"}
            </Button>
            <div className="space-y-4">
              {prompts.length > 0 ? (
                prompts.map((prompt, index) => (
                  <div key={index}>
                    <Label className="mb-2 block">{prompt}</Label>
                    <Textarea placeholder="Your thoughts..." />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Click "Generate Prompts" to start.</p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h3 className="font-semibold text-lg">3. Life-Area Journaling</h3>
            <p className="text-muted-foreground text-sm mb-4">Contextual prompts for your active Life Areas.</p>
            <div className="space-y-6">
                {activeLifeAreas.map(area => (
                    <Card key={area.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base"><area.icon className="w-4 h-4"/> {area.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Label className="mb-2 block">How did you nurture your <span className="font-semibold">{area.name.toLowerCase()}</span> today?</Label>
                            <Textarea placeholder={`Reflect on ${area.name}...`} />
                        </CardContent>
                    </Card>
                ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h3 className="font-semibold text-lg">4. Activity Recall</h3>
            <p className="text-muted-foreground text-sm mb-4">Log your day's activities conversationally.</p>
            <Textarea
              placeholder="e.g., This morning I went for a 45 minute run, then worked on the project from 9am for 3 hours..."
              value={activityInput}
              onChange={(e) => setActivityInput(e.target.value)}
              className="mb-4"
            />
            <Button onClick={handleParseActivities} disabled={isLoading || !activityInput}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Parse Activities
            </Button>
            {parsedActivities.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Parsed Activities (Confirm or Edit)</h4>
                <div className="flex flex-wrap gap-2">
                  {parsedActivities.map((act, index) => (
                    <Badge key={index} variant="secondary" className="p-2 text-sm">
                      {act.activity}
                      {act.startTime && ` at ${act.startTime}`}
                      {act.duration && ` for ${act.duration}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div>
            <h3 className="font-semibold text-lg">5. Summary</h3>
            <p className="text-muted-foreground text-sm mb-4">Review your entries before submitting.</p>
            <div className="space-y-4">
                <p><strong>Objectives:</strong> 1/2 completed.</p>
                <p><strong>General Journal:</strong> Entries captured.</p>
                <p><strong>Life Area Journals:</strong> Entries for Health and Personal Growth captured.</p>
                <p><strong>Activities:</strong> {parsedActivities.length} activities logged.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="relative h-1 w-full bg-muted rounded-full">
        <div
          className="absolute h-1 bg-primary rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      <div className="min-h-[300px]">{renderStep()}</div>
      
      <Separator />

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</p>
        {currentStep < totalSteps ? (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button>Submit Review</Button>
        )}
      </div>
    </div>
  );
}
