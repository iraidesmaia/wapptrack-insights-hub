import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { usePendingLeadConverter } from '@/hooks/usePendingLeadConverter';
const PendingLeadConverter = () => {
  const {
    convertPendingLeads,
    isConverting
  } = usePendingLeadConverter();
  return <Card className="mb-6">
      
      
    </Card>;
};
export default PendingLeadConverter;