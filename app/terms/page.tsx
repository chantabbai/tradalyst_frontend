'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { FileText, Shield, UserCheck, Mail } from 'lucide-react';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Terms and Conditions</h1>
          <p className="text-muted-foreground">
            Please read these terms and conditions carefully before using our services.
          </p>
        </div>
        
        <div className="grid gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Acceptance of Terms</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>By accessing or using our services, you agree to be bound by these terms and conditions.</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <UserCheck className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">User Responsibilities</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>As a user, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and complete information.</li>
                <li>Maintain the confidentiality of your account credentials.</li>
                <li>Notify us immediately of any unauthorized use of your account.</li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Limitation of Liability</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>Our liability is limited to the maximum extent permitted by law. We are not liable for any indirect, incidental, or consequential damages arising from your use of our services.</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Mail className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Contact Us</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>If you have any questions about these terms, please contact us:</p>
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

export default TermsPage; 