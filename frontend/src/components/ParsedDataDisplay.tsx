'use client';

import { CheckCircle, XCircle, FileText, GraduationCap, Award, MapPin } from 'lucide-react';
import { ParsedApplication } from '@/types';

interface ParsedDataDisplayProps {
  data: ParsedApplication;
}

export default function ParsedDataDisplay({ data }: ParsedDataDisplayProps) {
  const { visa, usmle, ecfmg_status_report } = data;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Application Analysis</h2>
        <p className="text-gray-600">Successfully parsed your USMLE application</p>
      </div>

      {/* Visa Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center space-x-3">
            <MapPin className="h-6 w-6 text-white" />
            <h3 className="text-xl font-semibold text-white">Visa & Work Authorization</h3>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Authorized to Work in US:</span>
                <div className="flex items-center space-x-2">
                  {visa.authorized_to_work_us === 'Yes' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${visa.authorized_to_work_us === 'Yes' ? 'text-green-700' : 'text-red-700'}`}>
                    {visa.authorized_to_work_us || 'Not specified'}
                  </span>
                </div>
              </div>

              {visa.current_work_authorization && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Current Work Authorization:</span>
                  <span className="text-blue-700 font-semibold">{visa.current_work_authorization}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Visa Sponsorship Needed:</span>
                <div className="flex items-center space-x-2">
                  {visa.visa_sponsorship_needed === 'No' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${visa.visa_sponsorship_needed === 'No' ? 'text-green-700' : 'text-red-700'}`}>
                    {visa.visa_sponsorship_needed || 'Not specified'}
                  </span>
                </div>
              </div>

              {visa.visa_sponsorship_sought && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Visa Type Sought:</span>
                  <span className="text-purple-700 font-semibold">{visa.visa_sponsorship_sought}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* USMLE Results Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-6 w-6 text-white" />
              <h3 className="text-xl font-semibold text-white">USMLE Step 1</h3>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Status:</span>
              <div className="flex items-center space-x-2">
                {usmle.step1.passed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-semibold ${usmle.step1.passed ? 'text-green-700' : 'text-red-700'}`}>
                  {usmle.step1.passed ? 'Passed' : 'Failed'}
                </span>
              </div>
            </div>

            {usmle.step1.score && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Score:</span>
                <span className="text-2xl font-bold text-gray-900">{usmle.step1.score}</span>
              </div>
            )}

            {usmle.step1.pass_date && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Pass Date:</span>
                <span className="text-blue-700 font-semibold">{usmle.step1.pass_date}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Attempts:</span>
              <span className="text-gray-900 font-semibold">{usmle.step1.failures + 1}</span>
            </div>

            {usmle.step1.failures > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Failures:</span>
                <span className="text-red-700 font-semibold">{usmle.step1.failures}</span>
              </div>
            )}
          </div>
        </div>

        {/* Step 2 CK */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <div className="flex items-center space-x-3">
              <Award className="h-6 w-6 text-white" />
              <h3 className="text-xl font-semibold text-white">USMLE Step 2 CK</h3>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Status:</span>
              <div className="flex items-center space-x-2">
                {usmle.step2_ck.passed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-semibold ${usmle.step2_ck.passed ? 'text-green-700' : 'text-red-700'}`}>
                  {usmle.step2_ck.passed ? 'Passed' : 'Failed'}
                </span>
              </div>
            </div>

            {usmle.step2_ck.score && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Score:</span>
                <span className="text-2xl font-bold text-gray-900">{usmle.step2_ck.score}</span>
              </div>
            )}

            {usmle.step2_ck.pass_date && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Pass Date:</span>
                <span className="text-blue-700 font-semibold">{usmle.step2_ck.pass_date}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Attempts:</span>
              <span className="text-gray-900 font-semibold">{usmle.step2_ck.failures + 1}</span>
            </div>

            {usmle.step2_ck.failures > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Failures:</span>
                <span className="text-red-700 font-semibold">{usmle.step2_ck.failures}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ECFMG Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-white" />
            <h3 className="text-xl font-semibold text-white">ECFMG Status</h3>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">ECFMG Certified:</span>
            <div className="flex items-center space-x-2">
              {ecfmg_status_report.certified === 'Yes' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <span className={`text-lg font-bold ${ecfmg_status_report.certified === 'Yes' ? 'text-green-700' : 'text-red-700'}`}>
                {ecfmg_status_report.certified}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
