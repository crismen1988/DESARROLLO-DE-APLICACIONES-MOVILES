import React, { useState } from 'react';
import { ChatMessage, UserRole } from '../types';
import { Send, MessageSquare, ShieldCheck, UserCheck } from 'lucide-react';

interface ChatViewProps {
  messages: ChatMessage[];
  currentRole: UserRole;
  currentUserId: string;
  currentUserName: string;
  onSendMessage: (text: string, recipientId: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  currentRole,
  currentUserId,
  currentUserName,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');

  const latestInterlocutorMessage = [...messages]
    .reverse()
    .find(message => message.senderId !== currentUserId);
  const defaultRecipientId = latestInterlocutorMessage?.senderId ?? (currentRole === 'turista' ? 'op-1' : undefined);
  const interlocutorName = latestInterlocutorMessage
    ? `${latestInterlocutorMessage.senderName} (${latestInterlocutorMessage.senderRole === 'turista' ? 'Turista' : 'Operador'})`
    : currentRole === 'turista'
      ? 'Operador turístico'
      : 'Sin conversación activa';
  const interlocutorInitials = latestInterlocutorMessage?.senderName
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? (currentRole === 'turista' ? 'OT' : '--');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !defaultRecipientId) return;
    onSendMessage(inputText.trim(), defaultRecipientId);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-[min(560px,68dvh)] min-h-[420px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Chat Header */}
      <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold text-xs">
            {interlocutorInitials}
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1">
              {interlocutorName}
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            </h4>
            <p className="text-[10px] text-teal-300">Respuesta en ~5 minutos • Verificado por BañosTour</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-teal-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
          Canal protegido
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50">
        <div className="text-center my-1">
          <span className="text-[10px] text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded-full">
            Canal privado protegido conforme a la LOPDP
          </span>
        </div>

        {messages.map(msg => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-600">
                <span className="font-semibold">{msg.senderName}</span>
                <span>• {msg.timestamp}</span>
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                  isMe
                    ? 'bg-teal-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={
            currentRole === 'turista'
              ? 'Pregunta sobre horarios, clima, qué ropa llevar...'
              : 'Escribe tu respuesta al turista...'
          }
          className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || !defaultRecipientId}
          className="w-9 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white flex items-center justify-center shadow active:scale-95 transition-transform shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
