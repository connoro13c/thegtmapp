import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

interface CardWidgetProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  link?: string;
  icon?: string;
}

function CardWidget({ title, description, children, link, icon }: CardWidgetProps) {
  return (
    <Card className="text-center p-2 hover:translate-y-[-2px] transition-transform">
      <CardHeader>
        {icon && (
          <div className="mx-auto mb-4 bg-primary/5 w-12 h-12 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-primary rounded-full"></div>
          </div>
        )}
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      <CardFooter className="flex justify-center">
        {link && (
          <Button variant="outline" asChild size="sm" className="text-primary border-primary/20 hover:border-primary/50">
            <a href={link}>View Details</a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function PageDashboard() {
  return (
    <div className="container mx-auto py-10 px-4 bg-background-offset min-h-screen">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-bold mb-4 text-primary">The only platform built for RevOps.</h1>
        <p className="text-xl text-gray-600 mb-8">Everything you need to build, deploy, and optimize GTM—on one screen.</p>
        <button className="bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors">
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <CardWidget 
          title="Account Scoring"
          description="Flex intent scoring that prioritizes revenue."
          icon="circle"
        />
        
        <CardWidget
          title="Segmentation & Targeting"
          description="Strategic and drop smarter, picky with insights."
          icon="layers"
        />
        
        <CardWidget
          title="Territory Design"
          description="Efficient territory auto-optimization">
          <div className="mt-4">
            <p className="text-sm text-gray-500">Optimize coverage with AI-powered territory mapping.</p>
          </div>
        </CardWidget>
        
        <CardWidget
          title="Account Assignment"
          description="Automate with full control.">
          <div className="mt-4">
            <p className="text-sm text-gray-500">AI-powered account distribution based on your custom rules.</p>
          </div>
        </CardWidget>
        
        <CardWidget
          title="Quota & Goal Setting"
          description="Align quotes to strategy seamlessly">
          <div className="mt-4">
            <p className="text-sm text-gray-500">Set realistic, data-driven targets for your team.</p>
          </div>
        </CardWidget>
        
        <CardWidget
          title="Automation Engine"
          description="Quick setup, scalability">
          <div className="mt-4">
            <p className="text-sm text-gray-500">Reduce manual workload with intelligent workflows.</p>
          </div>
        </CardWidget>
      </div>
      
      <div className="mt-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-primary mb-6">How It Works</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1">
                  <span className="text-primary font-semibold">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Start Simple</h3>
                  <p className="text-gray-600">Begin with your core GTM data and quickly expand as you need.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1">
                  <span className="text-primary font-semibold">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Integrate Everything</h3>
                  <p className="text-gray-600">Connect your existing tools in minutes with our no-code integrations.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-start mb-8">
              <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 text-primary">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Fast Time-to-value</h3>
                <p className="text-gray-600">Actionable insights in minutes, not weeks or months.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 text-primary">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Continuous Improvement</h3>
                <p className="text-gray-600">Our platform evolves with your business needs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}