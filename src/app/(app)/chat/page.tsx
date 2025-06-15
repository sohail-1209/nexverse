
'use client';

import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageSquareIcon, User, Bot, Loader2, Paperclip, XCircle, FileText, Camera, ImageUp, AlertTriangle, Mic, MicOff, Trash2, Eraser } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';
import { askGeneralQuestion, GeneralChatInput, GeneralChatOutput } from '@/ai/flows/general-chat-flow';
import { askQuestionWithImage, ChatWithImageInput, ChatWithImageOutput } from '@/ai/flows/chat-with-image-flow';
import { toast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  pdfFileName?: string;
  imageFileName?: string;
}

interface AttachedPdf {
  name: string;
  textContent: string | null;
  file: File;
}

const LOCAL_STORAGE_CHAT_KEY = 'nexverseChatMessages';
const initialGreetingMessage: Message = { 
  id: 'ai-greeting', 
  text: "Hello! I'm your AI Assistant. How can I help you today? You can ask me questions, attach a PDF, send an image, or use voice input for a comprehensive interaction. I can also research online for you!", 
  sender: 'ai', 
  timestamp: new Date() 
};


declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
  }
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([initialGreetingMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false); 
  
  const [attachedPdf, setAttachedPdf] = useState<AttachedPdf | null>(null);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  
  const [showCameraView, setShowCameraView] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [speechApiSupported, setSpeechApiSupported] = useState(true);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);


  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };
  
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedMessagesRaw = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
        if (savedMessagesRaw) {
          const parsedMessages: Message[] = JSON.parse(savedMessagesRaw).map((msg: Message) => ({
            ...msg,
            timestamp: new Date(msg.timestamp), 
          }));
          if (parsedMessages.length > 0) {
            setMessages(parsedMessages);
          }
        }
      }
    } catch (error) {
      console.error("Error loading messages from localStorage:", error);
      toast({
        title: "Chat Load Error",
        description: "Could not load previous chat history. Your browser's local storage might be unavailable or corrupted.",
        variant: "destructive",
      });
      setMessages([initialGreetingMessage]); 
    } finally {
      setIsHistoryLoaded(true); 
    }
  }, []); 

  useEffect(() => {
    if (!isHistoryLoaded) {
      return;
    }
    try {
      if (typeof window !== 'undefined') {
        if (messages.length === 1 && messages[0].id === initialGreetingMessage.id) {
          localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
        } else if (messages.length > 0) { 
          localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(messages));
        }
      }
    } catch (error) {
      console.error("Error saving messages to localStorage:", error);
      toast({
        title: "Chat Save Error",
        description: "Could not save chat history. Your messages might not persist if you refresh. This might be due to browser settings or storage limits.",
        variant: "destructive",
      });
    }
  }, [messages, isHistoryLoaded]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth'});
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (speechRecognitionRef.current && isListening) {
        speechRecognitionRef.current.stop();
      }
    };
  }, [isListening]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechApiSupported(false);
      console.warn("Speech Recognition API not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true; 
    recognition.interimResults = false; 
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let newTranscriptPart = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        newTranscriptPart += event.results[i][0].transcript + " "; 
      }
      if (newTranscriptPart.trim()) {
        setInput((prevInput) => prevInput + newTranscriptPart.trimEnd()); 
      }
    };

    recognition.onerror = (event: any) => { 
      console.error('Speech recognition error', event.error);
      let errorMsg = 'An error occurred during speech recognition.';
      if (event.error === 'no-speech') errorMsg = 'No speech detected. Please try again.';
      if (event.error === 'audio-capture') errorMsg = 'Microphone problem. Please check your microphone.';
      if (event.error === 'not-allowed') {
        errorMsg = 'Microphone access denied. Please enable it in browser settings.';
        setMicPermission('denied');
      }
      toast({ title: 'Speech Error', description: errorMsg, variant: 'destructive' });
      setIsListening(false); 
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    speechRecognitionRef.current = recognition;

    navigator.permissions?.query({ name: 'microphone' as PermissionName }).then((permissionStatus) => {
      setMicPermission(permissionStatus.state);
      permissionStatus.onchange = () => {
        setMicPermission(permissionStatus.state);
      };
    }).catch(() => {
        console.warn("Permissions API for microphone not fully supported or errored.");
    });

  }, []);
  

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setIsPdfProcessing(true);
      setCapturedImage(null); 
      setShowCameraView(false); 
      setAttachedPdf({ name: file.name, textContent: null, file }); 
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
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const removeAttachedPdf = () => {
    setAttachedPdf(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
    }
  };

  const requestCameraPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({ title: "Camera Error", description: "Camera not supported by this browser.", variant: "destructive" });
      setHasCameraPermission(false);
      return false;
    }
    try {
      // Prefer rear camera (environment) if available
      const constraints = { 
        video: { 
          facingMode: { ideal: "environment" } 
        } 
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream; 
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);
      return true;
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      let description = 'Please enable camera permissions in your browser settings.';
      if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        description = "No camera found. Please ensure a camera is connected and enabled.";
      } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        description = "Camera access denied. Please enable camera permissions in your browser settings.";
      } else if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
        description = "The requested camera (e.g., rear camera) is not available or does not meet criteria. Trying with any available camera.";
         // Fallback to any camera if specific facingMode fails
        try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = fallbackStream;
            if (videoRef.current) {
                videoRef.current.srcObject = fallbackStream;
            }
            setHasCameraPermission(true);
            toast({
                title: 'Camera Switched',
                description: 'Using available camera.',
            });
            return true;
        } catch (fallbackError: any) {
            console.error('Fallback camera access error:', fallbackError);
            description = `Could not access any camera. Please check permissions and connections. Error: ${fallbackError.name}`;
            setHasCameraPermission(false);
        }
      }

      toast({
        variant: 'destructive',
        title: 'Camera Access Error',
        description: description,
      });
      return false;
    }
  };

  const handleToggleCameraView = async () => {
    if (showCameraView) { 
      setShowCameraView(false);
      setIsCapturing(false);
      setCapturedImage(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    } else { 
      setAttachedPdf(null); 
      const permissionGranted = await requestCameraPermission();
      if (permissionGranted) {
        setShowCameraView(true);
        setIsCapturing(true); 
        setCapturedImage(null);
      }
    }
  };

  const handleCaptureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/png');
        setCapturedImage(dataUri);
        setIsCapturing(false); 

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
      }
    }
  };
  
  const handleRemoveCapturedImage = () => {
    setCapturedImage(null);
  };

  const handleToggleListening = async () => {
    if (!speechApiSupported) {
      toast({ title: "Unsupported", description: "Voice input is not supported by your browser.", variant: "destructive" });
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (micPermission === 'denied') {
        toast({ title: "Permission Denied", description: "Microphone access is denied. Please enable it in your browser settings.", variant: "destructive" });
        return;
      }
      if (micPermission === 'prompt') {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true }); 
          setMicPermission('granted'); 
          speechRecognitionRef.current?.start();
        } catch (err) {
          console.error("Mic permission error:", err);
          setMicPermission('denied'); 
          toast({ title: "Permission Denied", description: "Microphone access was not granted or an error occurred.", variant: "destructive" });
          return;
        }
      } else if (micPermission === 'granted') {
         speechRecognitionRef.current?.start();
      }
    }
  };


  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedPdf && !capturedImage) || isLoading) return;

    let userMessageText = input.trim();
    let imageFileNameForMessage: string | undefined = undefined;

    if (capturedImage && !userMessageText) {
        userMessageText = "Image attached"; 
    } else if (capturedImage && userMessageText) {
        userMessageText = `${userMessageText}`;
    }
    
    if (attachedPdf && !userMessageText) {
        userMessageText = `Query regarding PDF: ${attachedPdf.name}`;
    }

    if (capturedImage) {
        imageFileNameForMessage = "captured_image.png";
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
      pdfFileName: attachedPdf?.name,
      imageFileName: imageFileNameForMessage,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    setIsLoading(true);

    try {
      let aiResponseData: GeneralChatOutput | ChatWithImageOutput;

      if (capturedImage) {
        const aiImageInput: ChatWithImageInput = {
          query: userMessage.text,
          imageDataUri: capturedImage,
          pdfTextContent: attachedPdf?.textContent || undefined,
        };
        aiResponseData = await askQuestionWithImage(aiImageInput);
      } else {
         const aiInput: GeneralChatInput = { 
          query: userMessage.text, 
          pdfTextContent: attachedPdf?.textContent || undefined,
        };
        aiResponseData = await askGeneralQuestion(aiInput);
      }
      
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
      if (capturedImage) {
        setCapturedImage(null);
        setShowCameraView(false); 
        setIsCapturing(false);
      }
    }
  };

  const handleClearChat = () => {
    setMessages([initialGreetingMessage]);
    toast({ title: 'Chat Cleared', description: 'Your chat history has been cleared.' });
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prevMessages => {
      const newMessages = prevMessages.filter(msg => msg.id !== messageId);
      if (newMessages.length === 0) {
        return [initialGreetingMessage];
      }
      return newMessages;
    });
    toast({ title: 'Message Deleted', description: 'The message has been removed.' });
  };


  return (
    <div className="flex flex-col h-full">
      <Card className="flex-grow flex flex-col shadow-xl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquareIcon className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-headline text-2xl">AI Chat Assistant</CardTitle>
                <CardDescription>Ask questions, get summaries, or seek help. Attach PDFs, capture images, or use voice input.</CardDescription>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" title="Clear Chat History" disabled={messages.length <= 1 && messages[0].id === 'ai-greeting'}>
                  <Eraser className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to clear all messages in this chat? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearChat} className="bg-destructive hover:bg-destructive/90">Clear Chat</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <ScrollArea className="h-full p-4 md:p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`group relative flex items-end gap-3 ${
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
                    {(message.pdfFileName || message.imageFileName) && message.sender === 'user' && (
                      <div className="mt-2 pt-2 border-t border-primary-foreground/30">
                        {message.pdfFileName && (
                          <p className="text-xs flex items-center gap-1 text-primary-foreground/80">
                            <FileText className="h-3 w-3" /> Attached: {message.pdfFileName}
                          </p>
                        )}
                        {message.imageFileName && (
                           <p className="text-xs flex items-center gap-1 text-primary-foreground/80">
                            <ImageUp className="h-3 w-3" /> Sent: {message.imageFileName}
                          </p>
                        )}
                      </div>
                    )}
                    <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.sender === 'user' && user && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                      <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                  )}
                  {message.id !== 'ai-greeting' && ( 
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button
                          variant="ghost"
                          size="icon"
                          className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6
                            ${message.sender === 'user' ? 'left-[-1.75rem]' : 'right-[-1.75rem]'}
                          `}
                          title="Delete Message"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this message? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteMessage(message.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
        
        {showCameraView && hasCameraPermission === false && (
            <CardFooter className="border-t pt-4">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Camera Access Denied</AlertTitle>
                    <AlertDescription>
                        NExVERSE needs camera access to capture images. Please enable it in your browser settings and try again.
                    </AlertDescription>
                </Alert>
            </CardFooter>
        )}
        {showCameraView && hasCameraPermission && isCapturing && (
            <CardFooter className="border-t p-4 flex-col gap-2">
                <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                <div className="flex gap-2 w-full">
                    <Button onClick={handleCaptureImage} className="flex-grow">
                        <Camera className="mr-2 h-4 w-4" /> Capture
                    </Button>
                    <Button variant="outline" onClick={handleToggleCameraView}>Cancel</Button>
                </div>
            </CardFooter>
        )}

        {!isCapturing && ( 
            <CardFooter className="border-t pt-4 pb-4 flex-col items-start gap-2">
            {attachedPdf && !showCameraView && ( 
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
            {capturedImage && !isCapturing && ( 
                <div className="w-full p-2 bg-muted rounded-md text-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                        <ImageUp className="h-4 w-4 text-primary" />
                        <span>Image Preview</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleRemoveCapturedImage} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                        <XCircle className="h-4 w-4" />
                        </Button>
                    </div>
                    <Image src={capturedImage} alt="Captured preview" width={500} height={281} className="rounded-md object-contain max-h-48 w-auto mx-auto" data-ai-hint="user image" />
                </div>
            )}

            {!showCameraView && ( 
                <form onSubmit={handleSendMessage} className="flex w-full items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || isPdfProcessing || showCameraView || isListening}
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
                        disabled={isLoading || isPdfProcessing || showCameraView || isListening}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleToggleCameraView}
                        disabled={isLoading || isPdfProcessing || isListening}
                        title={showCameraView ? "Close Camera" : "Open Camera"}
                    >
                    <Camera className="h-5 w-5" />
                    <span className="sr-only">{showCameraView ? "Close Camera" : "Open Camera"}</span>
                    </Button>
                     <Button
                        type="button"
                        variant={isListening ? "destructive" : "outline"}
                        size="icon"
                        onClick={handleToggleListening}
                        disabled={isLoading || isPdfProcessing || showCameraView || !speechApiSupported}
                        title={isListening ? "Stop Listening" : "Start Voice Input"}
                    >
                        {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        <span className="sr-only">{isListening ? "Stop Listening" : "Start Voice Input"}</span>
                    </Button>
                    <Input
                        type="text"
                        placeholder={isListening ? "Listening..." : "Type your message..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading || isPdfProcessing || (showCameraView && isCapturing)}
                        className="flex-grow"
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={isLoading || isPdfProcessing || (showCameraView && isCapturing) || (!input.trim() && !attachedPdf && !capturedImage)}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    <span className="sr-only">Send</span>
                    </Button>
                </form>
            )}
            {showCameraView && capturedImage && !isCapturing && ( 
                 <form onSubmit={handleSendMessage} className="flex w-full items-center gap-3 mt-2">
                    <Input
                        type="text"
                        placeholder="Type your query about the image..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        className="flex-grow"
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={isLoading || (!input.trim() && !capturedImage)}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        <span className="sr-only">Send with Image</span>
                    </Button>
                 </form>
            )}
            </CardFooter>
        )}
        <canvas ref={canvasRef} className="hidden"></canvas>
      </Card>
    </div>
  );
}

