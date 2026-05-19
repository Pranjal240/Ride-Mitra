import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PiArrowLeftBold, PiPaperPlaneRightBold, PiChatCircleBold, PiSpinnerBold } from 'react-icons/pi';
import { useAuthStore } from '../hooks/useStore';
import { useRealtimeMessages } from '../hooks/useRealtime';
import { getMessages, sendMessage } from '../lib/api';
import type { Message } from '../types';
import { format } from 'date-fns';
import T, { FONT } from '../lib/theme';

// Theme imported from shared file

export default function Chat() {
  const { rideId } = useParams<{ rideId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const newMsg = useRealtimeMessages(rideId || '');

  useEffect(() => {
    async function load() {
      if (!rideId) return;
      try { setMessages(await getMessages(rideId)); }
      catch (e) { console.error(e); }
    }
    load();
  }, [rideId]);

  useEffect(() => {
    if (newMsg && !messages.find((m) => m.id === newMsg.id)) {
      setMessages((prev) => [...prev, newMsg]);
    }
  }, [newMsg]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!user || !rideId || !text.trim()) return;
    setSending(true);
    try {
      const msg = await sendMessage({ ride_id: rideId, sender_id: user.id, message: text.trim() });
      setMessages((prev) => [...prev, msg]);
      setText('');
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'Inter', sans-serif" }}>
      <div className="mobile-chat-container" style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 64px)' }}>
        {/* Header */}
        <div style={{
          padding:'12px 20px', background:'rgba(253,251,247,0.9)', backdropFilter:'blur(16px)',
          borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:12, flexShrink:0,
        }}>
          <motion.button whileHover={{ x:-2 }} whileTap={{ scale:0.9 }}
            onClick={() => navigate(-1)}
            style={{ padding:6, borderRadius:10, border:'none', background:T.gray100, cursor:'pointer', color:T.textSec, display:'flex' }}>
            <PiArrowLeftBold size={18}/>
          </motion.button>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${T.navy50},${T.gold50})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <PiChatCircleBold size={18} color={T.navy}/>
          </div>
          <div>
            <h2 style={{ fontSize:15, fontWeight:700, color:T.text, fontFamily:FONT.heading }}>Ride Chat</h2>
            <p style={{ fontSize:11, color:T.muted }}>Real-time messaging</p>
          </div>
        </div>

        {/* Messages area */}
        <div style={{
          flex:1, overflowY:'auto', padding:'16px 20px',
          background:`linear-gradient(180deg, ${T.gray100}, ${T.bg})`,
          display:'flex', flexDirection:'column', gap:8,
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 0', color:T.muted }}>
              <PiChatCircleBold size={40} style={{ opacity:0.2, marginBottom:12 }}/>
              <p style={{ fontSize:14 }}>No messages yet</p>
              <p style={{ fontSize:12, marginTop:4 }}>Start the conversation!</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <motion.div key={msg.id} initial={{ opacity:0, y:10, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
                style={{ display:'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth:'75%', padding:'10px 16px', fontSize:14, lineHeight:1.5,
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isMe ? `linear-gradient(135deg, ${T.blue}, ${T.blue})` : T.surface,
                  color: isMe ? 'white' : T.text,
                  boxShadow: isMe ? '0 4px 12px rgba(27,43,75,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                  border: isMe ? 'none' : `1px solid ${T.border}`,
                }}>
                  <p style={{ whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{msg.message}</p>
                  <p style={{ fontSize:10, marginTop:4, opacity: isMe ? 0.7 : 0.5, textAlign:'right' }}>
                    {format(new Date(msg.created_at), 'h:mm a')}
                  </p>
                </div>
              </motion.div>
            );
          })}
          <div ref={bottomRef}/>
        </div>

        {/* Input bar */}
        <div style={{
          padding:'12px 16px', background:'rgba(253,251,247,0.95)', backdropFilter:'blur(16px)',
          borderTop:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:10, flexShrink:0,
        }}>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)}
            placeholder="Type a message..."
            style={{
              flex:1, padding:'12px 16px', borderRadius:14,
              border:`1.5px solid ${inputFocused ? T.blue : T.border}`,
              background:T.gray100, color:T.text, fontSize:14, outline:'none',
              fontFamily:'inherit', transition:'all 0.3s',
              boxShadow: inputFocused ? `0 0 0 3px rgba(27,43,75,0.08)` : 'none',
            }}/>
          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.9 }}
            onClick={handleSend} disabled={!text.trim() || sending}
            style={{
              width:44, height:44, borderRadius:14, border:'none',
              background: text.trim() ? `linear-gradient(135deg, ${T.blue}, ${T.blue})` : T.gray200,
              color: text.trim() ? 'white' : T.muted,
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
              boxShadow: text.trim() ? '0 4px 12px rgba(27,43,75,0.2)' : 'none',
              transition:'all 0.3s', opacity: sending ? 0.6 : 1,
            }}>
            {sending ? (
              <div style={{ animation:'spin-slow 0.7s linear infinite', display:'flex' }}><PiSpinnerBold size={18}/></div>
            ) : (
              <PiPaperPlaneRightBold size={18}/>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
