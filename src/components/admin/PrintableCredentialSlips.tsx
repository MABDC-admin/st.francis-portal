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
  printedBy?: string;
}

export const PrintableCredentialSlips = forwardRef<HTMLDivElement, PrintableCredentialSlipsProps>(
  ({ credentials, schoolName = 'EduTrack', printedBy }, ref) => {
    const printDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div ref={ref} className="print-container">
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              /* Only hide other elements if we're printing the main window */
              body > :not(.print-container):not(script):not(style) {
                display: none !important;
              }
            }
            .print-container {
              width: 100%;
              background: white;
            }
            .credential-slip {
              border: 1px dashed #666;
              padding: 8px;
              margin-bottom: 4px;
              page-break-inside: avoid;
              background: white;
              display: flex;
              flex-direction: column;
              min-height: 140px;
            }
            .slip-header {
              text-align: center;
              border-bottom: 1px solid #ccc;
              padding-bottom: 4px;
              margin-bottom: 8px;
            }
            .slip-header h3 {
              font-size: 11px;
              font-weight: bold;
              margin: 0;
              color: #333;
            }
            .slip-header p {
              font-size: 8px;
              color: #666;
              margin: 2px 0 0 0;
            }
            .slip-content {
              display: grid;
              grid-template-columns: 1fr;
              gap: 4px;
              flex-grow: 1;
            }
            .slip-field {
              font-size: 9px;
            }
            .slip-field label {
              font-weight: 600;
              color: #444;
              display: block;
              margin-bottom: 1px;
            }
            .slip-field .value {
              font-family: monospace;
              font-size: 10px;
              background: #f5f5f5;
              padding: 2px 4px;
              border-radius: 2px;
              border: 1px solid #ddd;
              word-break: break-all;
            }
            .slip-footer {
              margin-top: 8px;
              padding-top: 4px;
              border-top: 1px dashed #ccc;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 2px;
              color: #888;
            }
            .cut-line {
              font-size: 7px;
              text-align: center;
            }
            .print-audit {
              font-size: 7px;
              font-style: italic;
              text-align: center;
              line-height: 1.1;
            }
            .slips-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
            }
            @media print {
              .slips-grid {
                grid-template-columns: repeat(4, 1fr);
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
                  <label>Portal Link</label>
                  <div className="value" style={{ color: '#0066cc', fontWeight: 'bold' }}>https://sfxsai.edu</div>
                </div>

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
                <div className="cut-line">
                  ✂️ Cut along dotted line • Please change password after login
                </div>
                {printedBy && (
                  <div className="print-audit">
                    Printed by: {printedBy}<br />
                    {printDate}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

PrintableCredentialSlips.displayName = 'PrintableCredentialSlips';
