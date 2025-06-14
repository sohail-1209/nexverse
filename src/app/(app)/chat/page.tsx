
'use client';

import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageSquareIcon, User, Bot, Loader2, Paperclip, XCircle, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';
import { askGeneralQuestion, GeneralChatInput, GeneralChatOutput } from '@/ai/flows/general-chat-flow';
import { toast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'; // Using legacy build for broader compatibility
// Make sure to set the workerSrc. You might need to copy the worker file to your public directory.
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  pdfFileName?: string; // To display if a PDF was sent with this message
}

interface AttachedPdf {
  name: string;
  textContent: string | null;
  file: File;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedPdf, setAttachedPdf] = useState<AttachedPdf | null>(null);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth'});
    }
  }, [messages]);
  
  useEffect(() => {
    setMessages([
      { id: 'ai-greeting', text: "Hello! I'm your NExVERSE AI Assistant. How can I help you today? You can ask me about exam topics, request summaries, or ask for help improving an answer. You can also attach a PDF for context.", sender: 'ai', timestamp: new Date() }
    ]);
  }, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setIsPdfProcessing(true);
      setAttachedPdf({ name: file.name, textContent: null, file }); // Show name immediately
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
        }
        setAttachedPdf({ name: file.name, textContent: fullText, file });
        toast({ title: "PDF Attached", description: `${file.name} is ready.` });
      } catch (error) {
        console.error('Error processing PDF:', error);
        toast({ title: "PDF Error", description: `Could not process ${file.name}. Please try another PDF.`, variant: "destructive" });
        setAttachedPdf(null);
      } finally {
        setIsPdfProcessing(false);
      }
    } else if (file) {
      toast({ title: "Invalid File", description: "Please select a PDF file.", variant: "destructive" });
    }
    // Reset file input to allow selecting the same file again if removed
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const removeAttachedPdf = () => {
    setAttachedPdf(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the file input
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedPdf) || isLoading) return;

    const userMessageText = input || (attachedPdf ? `Query regarding attached PDF: ${attachedPdf.name}` : "Sent a PDF.");

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
      pdfFileName: attachedPdf?.name,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    // The attachedPdf state is NO LONGER cleared here automatically.
    // It will persist until the user manually clicks the 'X' button.
    
    setIsLoading(true);

    try {
      const aiInput: GeneralChatInput = { 
        query: userMessage.text, // Use the actual text from userMessage which might include PDF context
        pdfTextContent: attachedPdf?.textContent || undefined,
      };
      const aiResponseData: GeneralChatOutput = await askGeneralQuestion(aiInput);
      const aiText = aiResponseData.response;

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: aiText,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message or getting AI response:', error);
      toast({
        title: "AI Error",
        description: "Sorry, I encountered an error trying to respond. Please try again.",
        variant: "destructive",
      });
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // The fileInputRef.current.value is NO LONGER reset here automatically.
      // This allows the same PDF to be "sent" with multiple messages if desired,
      // until manually cleared.
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-grow flex flex-col shadow-xl">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <MessageSquareIcon className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="font-headline text-2xl">AI Chat Assistant</CardTitle>
              <CardDescription>Ask questions, get summaries, or seek help. Attach PDFs for context.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <ScrollArea className="h-full p-4 md:p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end gap-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'ai' && (
                    <Avatar className="h-8 w-8">
                       <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-xl px-4 py-3 shadow ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted text-foreground rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    {message.pdfFileName && message.sender === 'user' && (
                      <div className="mt-2 pt-2 border-t border-primary-foreground/30">
                        <p className="text-xs flex items-center gap-1 text-primary-foreground/80">
                          <FileText className="h-3 w-3" /> Attached: {message.pdfFileName}
                        </p>
                      </div>
                    )}
                    <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.sender === 'user' && user && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                      <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-end gap-3 justify-start">
                    <Avatar className="h-8 w-8">
                       <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                    <div className="max-w-[70%] rounded-xl px-4 py-3 shadow bg-muted text-foreground rounded-bl-none">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                 </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t pt-4 pb-4 flex-col items-start gap-2">
           {attachedPdf && (
            <div className="flex items-center justify-between w-full p-2 bg-muted rounded-md text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4 text-primary" />
                <span>{attachedPdf.name}</span>
                {isPdfProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <Button variant="ghost" size="icon" onClick={removeAttachedPdf} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex w-full items-center gap-3">
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isPdfProcessing}
                title="Attach PDF"
              >
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Attach PDF</span>
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
                className="hidden"
                disabled={isLoading || isPdfProcessing}
            />
            <Input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || isPdfProcessing}
              className="flex-grow"
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={isLoading || isPdfProcessing || (!input.trim() && !attachedPdf)}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
