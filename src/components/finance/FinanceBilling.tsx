import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentAssessments } from './StudentAssessments';
import { FeeSetup } from './FeeSetup';
import { FeeTemplateManager } from './FeeTemplateManager';

export const FinanceBilling = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage account statements, fees, and templates</p>
      </div>

      <Tabs defaultValue="statements" className="w-full">
        <TabsList>
          <TabsTrigger value="statements">Account Statements</TabsTrigger>
          <TabsTrigger value="fee-setup">Fee Setup</TabsTrigger>
          <TabsTrigger value="templates">Fee Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="statements">
          <StudentAssessments />
        </TabsContent>

        <TabsContent value="fee-setup">
          <FeeSetup />
        </TabsContent>

        <TabsContent value="templates">
          <FeeTemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
