
'use client';

import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageSquareIcon, User, Bot, Loader2, Paperclip, XCircle, FileText, Camera, ImageUp, AlertTriangle } from 'lucide-react'; // Added Camera, ImageUp, AlertTriangle
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';
import { askGeneralQuestion, GeneralChatInput, GeneralChatOutput } from '@/ai/flows/general-chat-flow';
import { askQuestionWithImage, ChatWithImageInput, ChatWithImageOutput } from '@/ai/flows/chat-with-image-flow'; // Added new flow
import { toast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  pdfFileName?: string;
  imageFileName?: string; // For indicating an image was sent
  // imageDataUri?: string; // Not for localStorage, but for temporary display if needed
}

interface AttachedPdf {
  name: string;
  textContent: string | null;
  file: File;
}

const LOCAL_STORAGE_CHAT_KEY = 'nexverseChatMessages';

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [attachedPdf, setAttachedPdf] = useState<AttachedPdf | null>(null);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  
  const [showCameraView, setShowCameraView] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // Stores data URI
  const [isCapturing, setIsCapturing] = useState(false); // True when video feed is active

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
          setMessages(parsedMessages);
        } else {
          setMessages([
            { id: 'ai-greeting', text: "Hello! I'm your NExVERSE AI Assistant. How can I help you today? You can ask me about exam topics, request summaries, or ask for help improving an answer. You can also attach a PDF or send an image for context.", sender: 'ai', timestamp: new Date() }
          ]);
        }
      }
    } catch (error) {
      console.error("Error loading messages from localStorage:", error);
      setMessages([
        { id: 'ai-greeting', text: "Hello! I'm your NExVERSE AI Assistant. How can I help you today? You can ask me about exam topics, request summaries, or ask for help improving an answer. You can also attach a PDF or send an image for context.", sender: 'ai', timestamp: new Date() }
      ]);
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && messages.length > 0) {
        if (!(messages.length === 1 && messages[0].id === 'ai-greeting' && messages[0].sender === 'ai')) {
             localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(messages));
        }
      }
    } catch (error) {
      console.error("Error saving messages to localStorage:", error);
    }
  }, [messages]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth'});
    }
  }, [messages]);

  useEffect(() => {
    // Cleanup camera stream when component unmounts or camera view is closed
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);
  

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setIsPdfProcessing(true);
      setCapturedImage(null); // Clear any captured image if attaching PDF
      setShowCameraView(false); // Close camera view if open
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream; // Store stream for later use/cleanup
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);
      return true;
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
      return false;
    }
  };

  const handleToggleCameraView = async () => {
    if (showCameraView) { // If closing camera view
      setShowCameraView(false);
      setIsCapturing(false);
      setCapturedImage(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    } else { // If opening camera view
      setAttachedPdf(null); // Clear any attached PDF
      const permissionGranted = await requestCameraPermission();
      if (permissionGranted) {
        setShowCameraView(true);
        setIsCapturing(true); // Start in capturing mode
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
        setIsCapturing(false); // Move to preview mode

        // Stop camera stream after capture
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
    // Optionally, re-enable camera capture mode or close camera view
    // For now, it just removes the preview, user can re-open camera if needed.
    // To re-enable capture immediately:
    // requestCameraPermission().then(granted => {
    //  if (granted) setIsCapturing(true); else setShowCameraView(false);
    // });
  };


  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedPdf && !capturedImage) || isLoading) return;

    let userMessageText = input.trim();
    let imageFileNameForMessage: string | undefined = undefined;

    if (capturedImage && !userMessageText) {
        userMessageText = "Image attached"; // Default text if only image
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
    // PDF and Image are persisted until manually removed or camera view closed
    
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
      // Clear captured image after sending
      if (capturedImage) {
        setCapturedImage(null);
        setShowCameraView(false); // Close camera view after sending image
        setIsCapturing(false);
      }
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
              <CardDescription>Ask questions, get summaries, or seek help. Attach PDFs or capture images for context.</CardDescription>
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
        
        {/* Camera View Area */}
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

        {/* Normal Input Area or Image Preview Input Area */}
        {!isCapturing && ( // Hide normal input when actively capturing
            <CardFooter className="border-t pt-4 pb-4 flex-col items-start gap-2">
            {attachedPdf && !showCameraView && ( // Show PDF only if camera is not active
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
            {capturedImage && !isCapturing && ( // Show image preview if captured and not actively capturing
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
                    <Image src={capturedImage} alt="Captured preview" width={500} height={281} className="rounded-md object-contain max-h-48 w-auto mx-auto" />
                </div>
            )}

            {!showCameraView && ( /* Hide form if camera view itself is shown, but allow if only preview */
                <form onSubmit={handleSendMessage} className="flex w-full items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || isPdfProcessing || showCameraView}
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
                        disabled={isLoading || isPdfProcessing || showCameraView}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleToggleCameraView}
                        disabled={isLoading || isPdfProcessing}
                        title={showCameraView ? "Close Camera" : "Open Camera"}
                    >
                    <Camera className="h-5 w-5" />
                    <span className="sr-only">{showCameraView ? "Close Camera" : "Open Camera"}</span>
                    </Button>
                    <Input
                    type="text"
                    placeholder="Type your message..."
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
            {showCameraView && capturedImage && !isCapturing && ( /* Special form for when image is previewed */
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
