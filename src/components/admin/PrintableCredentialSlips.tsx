import { forwardRef } from 'react';

interface Credential {
  id: string;
  email: string;
  temp_password: string;
  student_name?: string;
  student_level?: string;
}

interface PrintableCredentialSlipsProps {
  credentials: Credential[];
  schoolName?: string;
}

export const PrintableCredentialSlips = forwardRef<HTMLDivElement, PrintableCredentialSlipsProps>(
  ({ credentials, schoolName = 'EduTrack' }, ref) => {
    return (
      <div ref={ref} className="print-container">
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              body * {
                visibility: hidden;
              }
              .print-container, .print-container * {
                visibility: visible;
              }
              .print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
            }
            .credential-slip {
              border: 2px dashed #666;
              padding: 16px;
              margin-bottom: 8px;
              page-break-inside: avoid;
              background: white;
            }
            .slip-header {
              text-align: center;
              border-bottom: 1px solid #ccc;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .slip-header h3 {
              font-size: 14px;
              font-weight: bold;
              margin: 0;
              color: #333;
            }
            .slip-header p {
              font-size: 10px;
              color: #666;
              margin: 4px 0 0 0;
            }
            .slip-content {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
            }
            .slip-field {
              font-size: 11px;
            }
            .slip-field label {
              font-weight: 600;
              color: #444;
              display: block;
              margin-bottom: 2px;
            }
            .slip-field .value {
              font-family: monospace;
              font-size: 12px;
              background: #f5f5f5;
              padding: 4px 8px;
              border-radius: 4px;
              border: 1px solid #ddd;
            }
            .slip-footer {
              margin-top: 12px;
              padding-top: 8px;
              border-top: 1px dashed #ccc;
              font-size: 9px;
              color: #888;
              text-align: center;
            }
            .slips-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            @media print {
              .slips-grid {
                grid-template-columns: 1fr 1fr;
              }
            }
          `}
        </style>
        
        <div className="slips-grid">
          {credentials.map((cred) => (
            <div key={cred.id} className="credential-slip">
              <div className="slip-header">
                <h3>{schoolName}</h3>
                <p>Student Login Credentials</p>
              </div>
              
              <div className="slip-content">
                <div className="slip-field" style={{ gridColumn: '1 / -1' }}>
                  <label>Student Name</label>
                  <div className="value">{cred.student_name || 'N/A'}</div>
                </div>
                
                <div className="slip-field">
                  <label>Grade Level</label>
                  <div className="value">{cred.student_level || 'N/A'}</div>
                </div>
                
                <div className="slip-field">
                  <label>Username (LRN)</label>
                  <div className="value">{cred.email}</div>
                </div>
                
                <div className="slip-field" style={{ gridColumn: '1 / -1' }}>
                  <label>Temporary Password</label>
                  <div className="value">{cred.temp_password}</div>
                </div>
              </div>
              
              <div className="slip-footer">
                ✂️ Cut along dotted line • Please change your password after first login
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

PrintableCredentialSlips.displayName = 'PrintableCredentialSlips';
