/**
 * WhatsApp Button Component
 * Generates AI-powered messages and opens WhatsApp deep link
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { MessageCircle, Loader2, Copy, ExternalLink } from 'lucide-react';
import { generateAIMessage, logWhatsAppClick } from '@/app/actions/whatsapp';
import type { MessageType, Language } from '@/lib/types/whatsapp';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppButtonProps {
    orderId: string;
    messageType?: MessageType;
    language?: Language;
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'lg';
}

export function WhatsAppButton({
    orderId,
    messageType = 'payment_pending',
    language = 'auto',
    variant = 'ghost',
    size = 'sm',
}: WhatsAppButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [message, setMessage] = useState<string>('');
    const [whatsappLink, setWhatsappLink] = useState<string>('');
    const [logId, setLogId] = useState<string>('');
    const { toast } = useToast();

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await generateAIMessage({
                orderId,
                messageType,
                language,
            });

            setMessage(result.message);
            setWhatsappLink(result.whatsappLink);
            setLogId(result.logId);
            setIsOpen(true);
        } catch (error) {
            console.error('Error generating message:', error);
            toast({
                title: 'Error',
                description: 'Failed to generate WhatsApp message. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(message);
        toast({
            title: 'Copied!',
            description: 'Message copied to clipboard',
        });
    };

    const handleSend = async () => {
        // Log the click
        if (logId) {
            await logWhatsAppClick(logId);
        }

        // Open WhatsApp
        window.open(whatsappLink, '_blank');
        setIsOpen(false);
    };

    return (
        <>
            <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant={variant}
                size={size}
                className="h-7 text-xs font-medium"
            >
                {isGenerating ? (
                    <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <MessageCircle className="mr-1 h-3 w-3" />
                        WhatsApp
                    </>
                )}
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>AI-Generated WhatsApp Message</DialogTitle>
                        <DialogDescription>
                            Review the message before sending to your customer
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-lg border bg-muted/50 p-4">
                            <p className="text-sm whitespace-pre-wrap">{message}</p>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleCopy}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy
                            </Button>
                            <Button
                                onClick={handleSend}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Send on WhatsApp
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="text-xs text-muted-foreground">
                        Powered by Kimi AI • Messages are personalized based on order context
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
