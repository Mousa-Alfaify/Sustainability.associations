"use client";

import * as React from "react";
import { Bot, CornerDownLeft, Sparkles, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store/app-store";
import {
  answerQuestion,
  SUGGESTED_QUESTIONS,
  type AdvisorAnswer,
  type AdvisorContext,
} from "@/lib/advisor/engine";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  role: "user" | "advisor";
  text?: string;
  answer?: AdvisorAnswer;
}

const CHIP_TONE = {
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
  warning: "border-warning/20 bg-warning/10 text-warning",
  success: "border-success/20 bg-success/10 text-success",
  neutral: "border-border bg-secondary text-foreground",
} as const;

function AnswerBubble({ answer }: { answer: AdvisorAnswer }) {
  return (
    <div className="w-full max-w-3xl rounded-2xl rounded-te-sm border border-border bg-card p-4 shadow-card">
      <p className="text-sm font-bold text-primary">{answer.headline}</p>

      <div className="mt-3 flex flex-col gap-2.5">
        {answer.paragraphs.map((paragraph, index) => (
          <p key={index} className="text-sm leading-7 text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </div>

      {answer.chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {answer.chips.map((chip) => (
            <div
              key={chip.label}
              className={cn(
                "rounded-lg border px-3 py-1.5",
                CHIP_TONE[chip.tone ?? "neutral"],
              )}
            >
              <p className="text-[11px] opacity-80">{chip.label}</p>
              <p className="tnum text-sm font-bold">{chip.value}</p>
            </div>
          ))}
        </div>
      )}

      {answer.bullets.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2 rounded-xl bg-muted/70 p-3">
          {answer.bullets.map((bullet, index) => (
            <li key={index} className="flex gap-2 text-xs leading-6">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="text-foreground">{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdvisorPage() {
  const { profile, metrics, score, portfolio, opportunities, plan } = useAppStore();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const counter = React.useRef(0);
  const endRef = React.useRef<HTMLDivElement>(null);

  const context = React.useMemo<AdvisorContext>(
    () => ({ profile, metrics, score, portfolio, opportunities, plan }),
    [profile, metrics, score, portfolio, opportunities, plan],
  );

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    const answer = answerQuestion(trimmed, context);
    setMessages((prev) => [
      ...prev,
      { id: ++counter.current, role: "user", text: trimmed },
      { id: ++counter.current, role: "advisor", answer },
    ]);
    setInput("");
  }

  const lastAnswer = [...messages].reverse().find((m) => m.answer)?.answer;
  const followUps = lastAnswer?.followUps ?? SUGGESTED_QUESTIONS;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <Card className="flex min-h-[70vh] flex-col">
        <CardHeader className="flex-row items-center gap-3 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle>مستشار الاستدامة</CardTitle>
            <CardDescription>
              يجيب من واقع أرقام {profile.name} — لا إجابات عامة
            </CardDescription>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">
            محرك قواعد · جاهز لربط API
          </Badge>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold">اسألني عن استدامة جمعيتك</p>
                <p className="mx-auto mt-1 max-w-md text-xs leading-6 text-muted-foreground">
                  كل إجابة تُبنى لحظيًا من ملفك المالي: الفجوة التشغيلية، الاحتياطي،
                  مصادر الدخل المقترحة، وفرص خفض المصروفات.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_QUESTIONS.slice(0, 6).map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => ask(question)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="rounded-2xl rounded-ts-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {message.text}
                </div>
              </div>
            ) : (
              <div key={message.id} className="flex justify-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                {message.answer && <AnswerBubble answer={message.answer} />}
              </div>
            ),
          )}
          <div ref={endRef} />
        </CardContent>

        <div className="border-t border-border p-4">
          {messages.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {followUps.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => ask(question)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  {question}
                </button>
              ))}
            </div>
          )}
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              ask(input);
            }}
          >
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="اكتب سؤالك عن استدامة جمعيتك…"
            />
            <Button type="submit" disabled={!input.trim()}>
              <CornerDownLeft className="h-4 w-4" />
              إرسال
            </Button>
          </form>
        </div>
      </Card>

      <div className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">أسئلة مقترحة</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {SUGGESTED_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => ask(question)}
                className="rounded-lg border border-border p-2.5 text-start text-xs leading-6 transition-colors hover:border-primary/40 hover:bg-accent"
              >
                {question}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">مصادر الإجابة</CardTitle>
            <CardDescription className="text-xs">
              يستخدم المستشار هذه المعطيات لحظيًا
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-xs">
            {[
              "ملف الجمعية ومصروفاتها التشغيلية",
              "تصنيف مصادر الدخل (متكرر/موسمي/مقيّد)",
              "مؤشر الاستقلال المالي ومكوناته",
              "محفظة الاستدامة المقترحة",
              "فرص تحسين الكفاءة",
              "خطة الاثني عشر شهرًا",
            ].map((source) => (
              <div
                key={source}
                className="flex items-center gap-2 rounded-md bg-secondary px-2.5 py-2"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">{source}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
