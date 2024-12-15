'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Shield, Lock, UserCircle, Mail } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Protecting your privacy and securing your data
          </p>
        </div>
        
        <div className="grid gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <UserCircle className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Information Collection</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>We collect essential information to provide you with our trading services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Basic account information</li>
                <li>Trading preferences and goals</li>
                <li>Trading history and analytics</li>
                <li>Device and usage information</li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Lock className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Data Security</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>Your data is protected with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>End-to-end encryption</li>
                <li>Regular security audits</li>                
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Your Rights</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>You have full control over your personal data:</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <ul className="list-disc list-inside space-y-2">
                  <li>Access your data</li>
                  <li>Request data deletion</li>
                  <li>Update information</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Mail className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Contact Us</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>For privacy-related inquiries:</p>
              <div className="space-y-2">
                <p>Email: <a href="mailto:support@tradalyst.com" className="text-primary hover:underline">support@tradalyst.com</a></p>
              </div>
            </div>
          </Card>
        </div>

        
      </motion.div>
    </div>
  );
};

export default PrivacyPage; 