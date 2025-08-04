import React, { useState } from 'react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import AccessShareCard from '../ui/AccessShareCard';

interface SendAccessEmailProps {
  userId: string;
  email: string;
  password: string;
}

/**
 * Component for sending access emails to users
 */
export const SendAccessEmail: React.FC<SendAccessEmailProps> = ({
  userId,
  email,
  password,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  
  const sendAccessEmail = async () => {
    setIsLoading(true);
    
    try {
      // Use the dedicated API endpoint for sending user access emails
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/email/user-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }
      
      toast.success('Access email sent successfully');
    } catch (error) {
      console.error('Error sending access email:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send access email');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {showCredentials ? (
        <AccessShareCard
          email={email}
          password={password}
          onSendEmail={sendAccessEmail}
          isEmailSending={isLoading}
        />
      ) : (
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setShowCredentials(true)}
        >
          <Mail className="h-4 w-4" />
          Show & Share Access
        </Button>
      )}
    </div>
  );
};

export default SendAccessEmail;
