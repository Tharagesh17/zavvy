import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, Clock } from 'lucide-react';
import Link from 'next/link';

interface ComingSoonFeatureProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  eta?: string;
  features?: string[];
  upgradePath?: string;
  currentTier?: 'free' | 'pro';
}

export function ComingSoonFeature({
  title,
  description,
  icon = <Sparkles className="h-8 w-8 text-blue-500" />,
  eta,
  features = [],
  upgradePath = '/upgrade',
  currentTier = 'free'
}: ComingSoonFeatureProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base mt-2">
          {description || 'This feature is coming soon!'}
        </CardDescription>
        
        {eta && (
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Expected: {eta}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {features.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Pro Features Include:
            </h4>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {currentTier === 'free' && (
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Upgrade to Pro to get early access to this feature
            </p>
            <Link href={upgradePath}>
              <Button className="w-full">
                Upgrade to Pro - ₹499/month
              </Button>
            </Link>
          </div>
        )}
        
        {currentTier === 'pro' && eta && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              As a Pro user, you will get access to this feature as soon as it launches
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simplified version for inline use
export function FeatureBadge({ 
  children,
  className = ''
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 ${className}`}>
      <Lock className="h-3 w-3" />
      {children}
    </span>
  );
}

// Preview card for feature showcase
export function FeaturePreview({
  title,
  description,
  icon,
  previewImage,
  eta
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  previewImage?: string;
  eta?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-white hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              {eta && (
                <span className="text-xs text-blue-600">Coming {eta}</span>
              )}
            </div>
          </div>
          <FeatureBadge>Pro</FeatureBadge>
        </div>
        
        <p className="mt-3 text-sm text-gray-600">{description}</p>
        
        {previewImage && (
          <div className="mt-4 relative">
            <img 
              src={previewImage} 
              alt={title}
              className="w-full h-32 object-cover rounded-lg opacity-50 group-hover:opacity-75 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                Preview
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
