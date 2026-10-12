import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export function buildDocumentationPdf(outputPath?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        if (outputPath) {
          try {
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(outputPath, result);
          } catch (e) {
            console.error('Failed to write PDF to file:', e);
          }
        }
        resolve(result);
      });
      doc.on('error', (err) => reject(err));

      // Brand Colors
      const primaryDark = '#0B3B2C';
      const emeraldGreen = '#10B981';
      const slateDark = '#1E293B';
      const slateGray = '#475569';
      const lightBg = '#F8FAF9';
      const accentBg = '#ECFDF5';

      // ----------------------------------------------------
      // COVER PAGE / HEADER
      // ----------------------------------------------------
      doc.rect(50, 50, 495, 120).fill(primaryDark);

      doc.fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(24)
        .text('VoteEase Voting System', 70, 70);

      doc.fillColor(emeraldGreen)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('COMPREHENSIVE TECHNICAL & ARCHITECTURAL DOCUMENTATION', 70, 102);

      doc.fillColor('#E2E8F0')
        .font('Helvetica')
        .fontSize(9)
        .text('Collegiate Single-Vote Integrity, Multi-Election Engine & Real-Time Auditing', 70, 122);

      doc.fillColor('#94A3B8')
        .font('Helvetica')
        .fontSize(8)
        .text(`Generated on: ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}  |  System Version: 2.4.0 (Full-Stack)`, 70, 142);

      let currentY = 195;

      const checkPageBreak = (neededHeight: number = 80) => {
        if (currentY + neededHeight > 740) {
          doc.addPage();
          currentY = 50;
        }
      };

      const addHeading1 = (title: string) => {
        checkPageBreak(50);
        doc.rect(50, currentY, 495, 24).fill('#F1F5F9');
        doc.fillColor(primaryDark)
          .font('Helvetica-Bold')
          .fontSize(13)
          .text(title, 58, currentY + 6);
        currentY += 34;
      };

      const addHeading2 = (title: string) => {
        checkPageBreak(35);
        doc.fillColor(primaryDark)
          .font('Helvetica-Bold')
          .fontSize(11)
          .text(title, 50, currentY);
        currentY += 16;
      };

      const addParagraph = (text: string) => {
        checkPageBreak(30);
        doc.fillColor(slateDark)
          .font('Helvetica')
          .fontSize(9.5)
          .lineGap(3)
          .text(text, 50, currentY, { width: 495, align: 'justify' });
        currentY = doc.y + 10;
      };

      const addBullet = (label: string, desc: string) => {
        checkPageBreak(25);
        doc.fillColor(emeraldGreen)
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('• ', 55, currentY, { continued: true });
        doc.fillColor(slateDark)
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .text(`${label}: `, { continued: true });
        doc.fillColor(slateGray)
          .font('Helvetica')
          .fontSize(9.5)
          .lineGap(2)
          .text(desc, { width: 480 });
        currentY = doc.y + 6;
      };

      // ----------------------------------------------------
      // SECTION 1: EXECUTIVE SUMMARY
      // ----------------------------------------------------
      addHeading1('1. Executive Overview');
      addParagraph(
        'VoteEase is an enterprise-grade collegiate voting and election management system designed to enforce cryptographic ballot privacy, eliminate duplicate voter fraud, and provide administrators with verifiable real-time turnout metrics. The architecture is engineered around the principle of strict zero-trust voter validation combined with thread-safe atomic commit transactions.'
      );

      addBullet('Multi-Tenant Election Engine', 'Allows institutions and election officers to manage multiple concurrent elections (e.g. Student Council, Department Representatives, Club Executives) with isolated voter rosters, candidate lineups, and unique passcodes.');
      addBullet('Single-Vote Guarantee', 'Guarantees that each eligible student roll number can cast only one verified ballot per election through atomic locking and state synchronization.');
      addBullet('Zero-Trust Voter Flow', 'Voters authenticate with a two-part credential: an Election Security Passcode followed by Roll Number verification.');
      addBullet('Comprehensive Audit & Export', 'Automates position tallies, margin-of-victory calculations, and multi-sheet Excel workbooks (.xlsx) alongside CSV raw audit logs.');

      // ----------------------------------------------------
      // SECTION 2: SYSTEM ARCHITECTURE & TECH STACK
      // ----------------------------------------------------
      addHeading1('2. System Architecture & Tech Stack');
      addParagraph(
        'The platform is built as a unified TypeScript application leveraging React 19 for the interactive client interface and Express on Node.js for authoritative API processing, data storage, and Excel workbook compilation.'
      );

      addBullet('Frontend', 'React 19, TypeScript, Tailwind CSS v4, Lucide React Icons, Motion animations, Chart.js.');
      addBullet('Backend API Gateway', 'Node.js, Express, tsx engine, esbuild bundling.');
      addBullet('Persistence Engine', 'Thread-safe synchronized database with atomic write locking (withLock) serialized to JSON and multi-tab Excel workbooks via ExcelJS.');
      addBullet('Security Protocol', 'Case-insensitive alphanumeric roll normalization, cryptographic vote reference generation, and sanitization of legacy browser state.');

      // ----------------------------------------------------
      // SECTION 3: CORE DATA MODELS
      // ----------------------------------------------------
      addHeading1('3. Core Domain Data Models');
      addParagraph(
        'All domain records are defined with strict TypeScript interfaces across the frontend and backend, ensuring end-to-end type safety:'
      );

      addBullet('AdminAccount', 'Attributes: id, fullName, collegeName, username, email, createdAt.');
      addBullet('Election', 'Attributes: id, adminId, electionName, collegeName, securityCode, positions (string[]), electionStatus ("Active" | "Closed"), createdAt, description, votersCount, votesCount, candidatesCount, turnoutPercentage, endDate.');
      addBullet('User (Voter Record)', 'Attributes: rollNumber, studentName, status ("Active" | "Inactive"), hasVoted ("Yes" | "No"), votedAt (timestamp), electionId.');
      addBullet('Candidate', 'Attributes: candidateId, candidateName, position, group/affiliation, imagePath, status ("Active" | "Inactive"), electionId.');
      addBullet('VoteRecord', 'Attributes: voteId, rollNumber, candidateId, candidateName, position, date, time, electionId.');

      // ----------------------------------------------------
      // SECTION 4: REST API SPECIFICATION
      // ----------------------------------------------------
      addHeading1('4. REST API Endpoints Specification');

      addHeading2('A. Admin Authentication & Accounts');
      addBullet('POST /api/admin/register', 'Creates an administrator profile. Newly created accounts start with zero default elections, voters, or votes.');
      addBullet('POST /api/admin/login', 'Authenticates admin credentials via username/email and password.');

      addHeading2('B. Multi-Election Management');
      addBullet('GET /api/admin/elections?adminId=:id', 'Fetches all elections belonging to the admin with calculated voter, candidate, and turnout counts.');
      addBullet('POST /api/admin/elections', 'Creates a new election with custom name, institution, security code, and ballot positions.');
      addBullet('PUT /api/admin/elections/:id', 'Updates election details, positions, or security passcode.');
      addBullet('DELETE /api/admin/elections/:id', 'Cascading deletion: removes election, candidate records, voters, and votes.');
      addBullet('POST /api/admin/elections/:id/toggle-status', 'Switches election status between "Active" and "Closed".');

      addHeading2('C. Voter Authentication & Voting');
      addBullet('POST /api/voter/verify-code', 'Validates election security code and returns election metadata.');
      addBullet('POST /api/voter/validate-roll', 'Checks voter roster eligibility (active status, not already voted).');
      addBullet('GET /api/voter/ballot/:electionId', 'Retrieves ballot choices grouped by position.');
      addBullet('POST /api/voter/cast-vote', 'Atomically logs ballot selections, records audit log, and sets hasVoted = Yes.');

      addHeading2('D. Analytics, Roster & Audit Export');
      addBullet('GET /api/stats?electionId=:id', 'Live turnout summary: total voters, voted count, remaining, turnout percentage.');
      addBullet('GET /api/results?electionId=:id', 'Aggregated vote tallies and declared winners per position.');
      addBullet('POST /api/users/bulk', 'Batch roster ingestion from pasted CSV/TSV data.');
      addBullet('GET /api/export/:type?electionId=:id', 'Generates and downloads certified Excel workbook (.xlsx) or CSV audit.');

      // ----------------------------------------------------
      // SECTION 5: VOTER INTEGRITY & SECURITY
      // ----------------------------------------------------
      addHeading1('5. Security, Concurrency & Single-Vote Integrity');
      addParagraph(
        'Online collegiate voting requires strict safeguards against vote duplication, race conditions, and ballot tampering:'
      );

      addBullet('Atomic Concurrency Locking', 'The database implements a promise-chained execution queue (withLock) ensuring simultaneous vote submissions are queued sequentially, eliminating double-vote vulnerabilities.');
      addBullet('Two-Factor Eligibility Gate', 'A voter cannot reach the ballot without passing both the election-specific security passcode verification and an active, non-voted student roll check.');
      addBullet('Zero-Default Account Architecture', 'Newly registered administrators receive completely empty dashboards (0 voters, 0 active elections, 0 votes, 0 candidates) to guarantee absolute data privacy and isolation.');
      addBullet('Cryptographic Receipts', 'Upon casting a ballot, the student receives a unique printable receipt containing a Reference ID, timestamp, and position breakdown.');

      // ----------------------------------------------------
      // SECTION 6: DEPLOYMENT & OPERATION
      // ----------------------------------------------------
      addHeading1('6. Deployment & Operational Runbook');
      addParagraph(
        'The application is fully containerized and production-ready for standard Node.js hosting environments (Google Cloud Run, Docker, VPS, or Kubernetes).'
      );

      addBullet('Development Mode', 'npm run dev — Runs Express server with Vite HMR middleware on port 3000.');
      addBullet('Lint & Validation', 'npm run lint — Executes TypeScript compiler (tsc --noEmit) for static verification.');
      addBullet('Production Build', 'npm run build — Compiles frontend client assets to /dist and bundles backend with esbuild into /dist/server.cjs.');
      addBullet('Production Start', 'npm run start — Executes the bundled Node.js server (node dist/server.cjs) serving both static assets and API routes.');

      // ----------------------------------------------------
      // FOOTER & PAGE NUMBERING
      // ----------------------------------------------------
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fillColor('#94A3B8')
          .font('Helvetica')
          .fontSize(8)
          .text(
            `VoteEase Documentation  |  Page ${i + 1} of ${totalPages}`,
            50,
            785,
            { align: 'center', width: 495 }
          );
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
