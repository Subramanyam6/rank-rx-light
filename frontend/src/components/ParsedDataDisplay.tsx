'use client';

import { CheckCircle, XCircle, FileText, GraduationCap, Award, MapPin } from 'lucide-react';
import { ParsedApplication } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ParsedDataDisplayProps {
  data: ParsedApplication;
}

function StatusBadge({ passed, label }: { passed: boolean; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      {passed ? (
        <CheckCircle className="h-5 w-5 text-green-600" />
      ) : (
        <XCircle className="h-5 w-5 text-red-600" />
      )}
      <span className={`font-medium ${passed ? 'text-green-700' : 'text-red-700'}`}>
        {label || (passed ? 'Yes' : 'No')}
      </span>
    </div>
  );
}

function DataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export default function ParsedDataDisplay({ data }: ParsedDataDisplayProps) {
  const { visa, usmle, ecfmg_status_report } = data;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-1">Application Analysis</h2>
        <p className="text-muted-foreground">Successfully parsed your ERAS application</p>
      </div>

      {/* Visa Status Card */}
      <Card className="bg-neutral-50 border-neutral-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 bg-blue-100 rounded">
              <MapPin className="h-4 w-4 text-blue-600" />
            </div>
            Visa & Work Authorization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <DataRow label="Authorized to Work in US">
              <StatusBadge 
                passed={visa.authorized_to_work_us === 'Yes'} 
                label={visa.authorized_to_work_us || 'Not specified'}
              />
            </DataRow>

            {visa.current_work_authorization && (
              <DataRow label="Current Work Authorization">
                <Badge variant="secondary" className="bg-neutral-200 text-neutral-700">{visa.current_work_authorization}</Badge>
              </DataRow>
            )}

            <DataRow label="Visa Sponsorship Needed">
              <StatusBadge 
                passed={visa.visa_sponsorship_needed === 'No'} 
                label={visa.visa_sponsorship_needed || 'Not specified'}
              />
            </DataRow>

            {visa.visa_sponsorship_sought && (
              <DataRow label="Visa Type Sought">
                <Badge variant="secondary" className="bg-neutral-200 text-neutral-700">{visa.visa_sponsorship_sought}</Badge>
              </DataRow>
            )}
          </div>
        </CardContent>
      </Card>

      {/* USMLE Results Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1 */}
        <Card className="bg-neutral-50 border-neutral-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-green-100 rounded">
                <GraduationCap className="h-4 w-4 text-green-600" />
              </div>
              USMLE Step 1
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DataRow label="Status">
              <StatusBadge passed={usmle.step1.passed} label={usmle.step1.passed ? 'Passed' : 'Failed'} />
            </DataRow>

            {usmle.step1.score && (
              <DataRow label="Score">
                <span className="text-2xl font-bold">{usmle.step1.score}</span>
              </DataRow>
            )}

            {usmle.step1.pass_date && (
              <DataRow label="Pass Date">
                <Badge variant="outline" className="border-neutral-300">{usmle.step1.pass_date}</Badge>
              </DataRow>
            )}

            <DataRow label="Attempts">
              <span className="font-medium">{usmle.step1.failures + 1}</span>
            </DataRow>

            {usmle.step1.failures > 0 && (
              <DataRow label="Failures">
                <Badge className="bg-red-100 text-red-700 border-red-200">{usmle.step1.failures}</Badge>
              </DataRow>
            )}
          </CardContent>
        </Card>

        {/* Step 2 CK */}
        <Card className="bg-neutral-50 border-neutral-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-red-100 rounded">
                <Award className="h-4 w-4 text-red-600" />
              </div>
              USMLE Step 2 CK
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DataRow label="Status">
              <StatusBadge passed={usmle.step2_ck.passed} label={usmle.step2_ck.passed ? 'Passed' : 'Failed'} />
            </DataRow>

            {usmle.step2_ck.score && (
              <DataRow label="Score">
                <span className="text-2xl font-bold">{usmle.step2_ck.score}</span>
              </DataRow>
            )}

            {usmle.step2_ck.pass_date && (
              <DataRow label="Pass Date">
                <Badge variant="outline" className="border-neutral-300">{usmle.step2_ck.pass_date}</Badge>
              </DataRow>
            )}

            <DataRow label="Attempts">
              <span className="font-medium">{usmle.step2_ck.failures + 1}</span>
            </DataRow>

            {usmle.step2_ck.failures > 0 && (
              <DataRow label="Failures">
                <Badge className="bg-red-100 text-red-700 border-red-200">{usmle.step2_ck.failures}</Badge>
              </DataRow>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ECFMG Status Card */}
      <Card className="bg-neutral-50 border-neutral-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 bg-neutral-200 rounded">
              <FileText className="h-4 w-4 text-neutral-600" />
            </div>
            ECFMG Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataRow label="ECFMG Certified">
            <StatusBadge 
              passed={ecfmg_status_report.certified === 'Yes'} 
              label={ecfmg_status_report.certified}
            />
          </DataRow>
        </CardContent>
      </Card>
    </div>
  );
}
