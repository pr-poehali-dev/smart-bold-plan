import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from '@/context/LanguageContext';

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = "https://functions.poehali.dev/5388f591-8e98-434e-b3b2-f3c6b753cbaa";

export default function ChatWidget() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Привет! Я ИИ-ассистент 3DFORM. Помогу с вопросами о 3D-печати и моделировании. Чем могу помочь?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply || "Произошла ошибка, попробуйте ещё раз." }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Не удалось получить ответ. Попробуйте позже." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 sm:w-96 bg-white border border-gray-200 shadow-2xl flex flex-col" style={{ height: "480px" }}>
          <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-sm font-medium tracking-wide uppercase">{t('ИИ-ассистент')}</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <Icon name="X" size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-black text-white"
                      : "bg-white border border-gray-200 text-gray-800"
                  }`}
                >
                  {t(msg.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-3 py-2 text-sm text-gray-400">
                  {t('Печатает...')}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-200 p-3 bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t('Напишите вопрос...')}
              className="flex-1 text-sm border border-gray-200 px-3 py-2 focus:outline-none focus:border-black transition-colors"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="bg-black text-white px-3 py-2 hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              <Icon name="Send" size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
      >
        <Icon name={open ? "X" : "MessageCircle"} size={24} />
      </button>
    </div>
  );
}