import React, { useState } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Label } from './label';
import { Clipboard, Copy, Check, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface AccessShareCardProps {
  email: string;
  password: string;
  loginUrl?: string;
  onSendEmail?: () => Promise<void>;
  isEmailSending?: boolean;
}

/**
 * A beautiful UI component for sharing access credentials with users
 */
export const AccessShareCard: React.FC<AccessShareCardProps> = ({
  email,
  password,
  loginUrl = `${window.location.origin}/login`,
  onSendEmail,
  isEmailSending = false,
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  const copyToClipboard = async (text: string, setter: (copied: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
      toast.success('Copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const copyAllToClipboard = async () => {
    try {
      const text = `
Email: ${email}
Password: ${password}
Login URL: ${loginUrl}
      `;
      await navigator.clipboard.writeText(text);
      toast.success('All credentials copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy credentials');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border border-gray-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Clipboard className="h-5 w-5" />
          Access Credentials
        </CardTitle>
        <CardDescription className="text-gray-100">
          Share these credentials with the user
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <div className="flex">
            <Input
              id="email"
              value={email}
              readOnly
              className="flex-1 bg-gray-50"
            />
            <Button
              variant="outline"
              size="icon"
              className="ml-2"
              onClick={() => copyToClipboard(email, setEmailCopied)}
            >
              {emailCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="flex">
            <Input
              id="password"
              type={passwordVisible ? "text" : "password"}
              value={password}
              readOnly
              className="flex-1 bg-gray-50"
            />
            <Button
              variant="outline"
              size="icon"
              className="ml-2"
              onClick={() => copyToClipboard(password, setPasswordCopied)}
            >
              {passwordCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setPasswordVisible(!passwordVisible)}
            >
              {passwordVisible ? "Hide Password" : "Show Password"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loginUrl" className="text-sm font-medium">
            Login URL
          </Label>
          <div className="flex">
            <Input
              id="loginUrl"
              value={loginUrl}
              readOnly
              className="flex-1 bg-gray-50"
            />
            <Button
              variant="outline"
              size="icon"
              className="ml-2"
              onClick={() => copyToClipboard(loginUrl, setUrlCopied)}
            >
              {urlCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2 bg-gray-50 border-t border-gray-100 p-4">
        <Button 
          variant="default" 
          className="w-full sm:w-auto"
          onClick={copyAllToClipboard}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy All
        </Button>
        {onSendEmail && (
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={onSendEmail}
            disabled={isEmailSending}
          >
            <Mail className="mr-2 h-4 w-4" />
            {isEmailSending ? 'Sending...' : 'Send Email'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AccessShareCard;
