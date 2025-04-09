import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

interface CardWidgetProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  link?: string;
}

function CardWidget({ title, description, children, link }: CardWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      <CardFooter>
        {link && (
          <Button variant="outline" asChild>
            <a href={link}>View</a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function LandingPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">GTM App Dashboard</h1>
      <p className="text-xl mb-10">Welcome to your GTM control center.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardWidget 
          title="Account Management"
          description="Create and manage your customer accounts."
          link="/accounts"
        />
        
        <CardWidget
          title="Territory Planning"
          description="Define and organize your sales territories."
          link="/territories"
        />
        
        <CardWidget
          title="Segmentation"
          description="Segment your market for targeted approaches.">
          <div className="mt-4">
            <ul className="list-disc pl-5 space-y-2">
              <li>Industry segmentation</li>
              <li>Geographic targeting</li>
              <li>Customer size categories</li>
            </ul>
          </div>
          <Button className="mt-4" variant="outline">Go to Segments</Button>
        </CardWidget>
        
        <CardWidget
          title="Performance Metrics"
          description="Track your sales team's performance.">
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-slate-100 p-2 rounded">
              <h4 className="font-medium">Conversion</h4>
              <p className="text-2xl font-bold text-green-600">24%</p>
            </div>
            <div className="bg-slate-100 p-2 rounded">
              <h4 className="font-medium">Retention</h4>
              <p className="text-2xl font-bold text-blue-600">78%</p>
            </div>
          </div>
          <Button className="mt-4" variant="outline">View Dashboard</Button>
        </CardWidget>
        
        <CardWidget
          title="Pipeline Management"
          description="Manage your sales pipeline effectively.">
          <div className="mt-4">
            <div className="bg-slate-100 p-2 rounded mb-2">
              <div className="flex justify-between">
                <span>Q1 Opportunities</span>
                <span className="font-bold">24</span>
              </div>
            </div>
            <div className="bg-slate-100 p-2 rounded">
              <div className="flex justify-between">
                <span>Active Deals</span>
                <span className="font-bold">12</span>
              </div>
            </div>
          </div>
          <Button className="mt-4" variant="outline">View Pipeline</Button>
        </CardWidget>
        
        <CardWidget
          title="Market Intelligence"
          description="Get insights about your target markets.">
          <p className="text-sm text-gray-500 mt-4">
            Latest intelligence reports available for Q1 2025.
          </p>
          <Button className="mt-4" variant="outline">View Reports</Button>
        </CardWidget>
        
        <CardWidget
          title="Getting Started"
          description="New to the platform? Start here.">
          <Button className="mt-4" variant="primary">Watch Tutorial</Button>
        </CardWidget>
      </div>
    </div>
  );
}