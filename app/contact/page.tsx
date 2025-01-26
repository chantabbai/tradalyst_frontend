"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = "https://tradalystbackend-chantabbai07ai.replit.app";

const ContactPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setIsSuccess(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, message }),
      });

      if (response.ok) {
        setIsSuccess(true);
        toast.success("Message sent successfully!");
        setEmail("");
        setMessage("");
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.error || "Failed to send message. Please try again.",
        );
      }
    } catch (error) {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto text-center space-y-6"
        >
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Message Sent Successfully!
          </h2>
          <p className="text-muted-foreground">
            Thank you for contacting us. We'll get back to you within 24 hours.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
          <p className="text-muted-foreground">
            Send us an email and we'll get back to you as soon as possible
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact Form */}
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                >
                  Your Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium mb-2"
                >
                  Your Message
                </label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  required
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </Card>

          {/* Contact Information */}
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <Mail className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Email Us</h3>
                  <a
                    href="mailto:support@tradalyst.com"
                    className="text-primary hover:underline"
                  >
                    support@tradalyst.com
                  </a>
                  <p className="text-sm text-muted-foreground mt-2">
                    We aim to respond to all inquiries within 24 hours
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ContactPage;
