'use client';

/**
 * Development Admin Dashboard
 * 
 * Development-only page for managing features, testing, and debugging
 * Accessible only in development mode at /dev/admin
 */

import React from 'react';
import { getAllFeatures, toggleFeature, type FeatureName } from '@/lib/features/config';
import { seedDevelopmentData, clearDevelopmentData } from '@/lib/dev/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

// Development guard - only render in dev mode
export default function DevAdminPage() {
  // Check if in development
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
          Admin dashboard only available in development mode
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Development Admin</h1>
          <p className="text-gray-600">Manage features, test data, and debug</p>
          <Badge variant="destructive" className="text-sm">
            DEVELOPMENT MODE ONLY
          </Badge>
        </div>
        
        {/* Feature Flags */}
        <FeatureManager />
        
        {/* Database Tools */}
        <DatabaseTools />
        
        {/* Environment Info */}
        <EnvironmentInfo />
      </div>
    </div>
  );
}

function FeatureManager() {
  const features = getAllFeatures();
  
  const handleToggle = (featureName: FeatureName, enabled: boolean) => {
    toggleFeature(featureName, enabled);
    // Force re-render by reloading page (simple approach for dev)
    window.location.reload();
  };
  
  // Group by tier
  const coreFeatures = Object.entries(features).filter(([, f]) => f.tier === 'core');
  const proFeatures = Object.entries(features).filter(([, f]) => f.tier === 'pro');
  const supportFeatures = Object.entries(features).filter(([, f]) => f.tier === 'support');
  const integrationFeatures = Object.entries(features).filter(([, f]) => f.tier === 'integration');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>
          Toggle features on/off for testing. Changes are runtime-only and reset on page reload.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Features */}
        <FeatureGroup title="Core Features (Always ON)" features={coreFeatures} readOnly />
        
        {/* Pro Features */}
        <FeatureGroup 
          title="Pro Features" 
          features={proFeatures} 
          onToggle={handleToggle}
        />
        
        {/* Support Features */}
        <FeatureGroup 
          title="Support System" 
          features={supportFeatures} 
          onToggle={handleToggle}
        />
        
        {/* Integration Features */}
        <FeatureGroup 
          title="Integrations" 
          features={integrationFeatures} 
          onToggle={handleToggle}
        />
      </CardContent>
    </Card>
  );
}

function FeatureGroup({ 
  title, 
  features, 
  onToggle,
  readOnly = false 
}: { 
  title: string; 
  features: [string, ReturnType<typeof getAllFeatures>[FeatureName]][];
  onToggle?: (name: FeatureName, enabled: boolean) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <div className="grid gap-3">
        {features.map(([name, config]) => (
          <div 
            key={name}
            className="flex items-center justify-between p-3 bg-white border rounded-lg"
          >
            <div className="space-y-1">
              <div className="font-medium text-sm">{name}</div>
              <div className="text-xs text-gray-500">{config.description}</div>
              {config.eta && (
                <div className="text-xs text-blue-600">ETA: {config.eta}</div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={config.currentStatus ? 'default' : 'secondary'}
                className="text-xs"
              >
                {config.currentStatus ? 'ON' : 'OFF'}
              </Badge>
              {!readOnly && onToggle && (
                <Switch
                  checked={config.currentStatus}
                  onCheckedChange={(checked) => onToggle(name as FeatureName, checked)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DatabaseTools() {
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  
  const handleSeed = async () => {
    setLoading(true);
    try {
      const result = await seedDevelopmentData();
      setMessage(result && result.success ? 'Database seeded successfully!' : 'Seeding failed');
    } catch (error) {
      setMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    setLoading(false);
  };
  
  const handleClear = async () => {
    setLoading(true);
    try {
      const result = await clearDevelopmentData();
      setMessage(result && result.success ? 'Database cleared!' : 'Clear failed');
    } catch (error) {
      setMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    setLoading(false);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Tools</CardTitle>
        <CardDescription>
          Manage development test data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            {message}
          </div>
        )}
        
        <div className="flex gap-4">
          <Button 
            onClick={handleSeed} 
            disabled={loading}
            variant="default"
          >
            {loading ? 'Working...' : 'Seed Test Data'}
          </Button>
          
          <Button 
            onClick={handleClear} 
            disabled={loading}
            variant="destructive"
          >
            Clear All Data
          </Button>
        </div>
        
        <div className="text-sm text-gray-600 space-y-1">
          <p>Seed data includes:</p>
          <ul className="list-disc list-inside pl-4">
            <li>3 test sellers (Free, Pro, Admin)</li>
            <li>3 sample products</li>
            <li>3 test orders (various statuses)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function EnvironmentInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Node Environment:</span>{' '}
            <Badge>{process.env.NODE_ENV}</Badge>
          </div>
          <div>
            <span className="font-medium">App Environment:</span>{' '}
            <Badge>{process.env.NEXT_PUBLIC_APP_ENV || 'not set'}</Badge>
          </div>
          <div>
            <span className="font-medium">Supabase URL:</span>{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✓' : 'Not set ✗'}
            </code>
          </div>
          <div>
            <span className="font-medium">Kimi API:</span>{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">
              {process.env.KIMI_API_KEY ? 'Set ✓' : 'Not set ✗'}
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
