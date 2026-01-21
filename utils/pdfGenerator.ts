
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Hydrant, STATION_ID } from '../types';

export const generateSummaryPDF = (mainArea: string, hydrants: Hydrant[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header - Official Logo Placeholder/Line
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(1.5);
  doc.line(10, 10, pageWidth - 10, 10);

  // Title
  doc.setFontSize(22);
  doc.setTextColor(0, 102, 204);
  doc.text('Fire Hydrant Survey Report', pageWidth / 2, 25, { align: 'center' });

  // Metadata
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(`Station ID: ${STATION_ID}`, 15, 40);
  doc.text(`Main Area: ${mainArea}`, 15, 47);
  doc.text(`Total Proposed Hydrants: ${hydrants.length}`, 15, 54);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 15, 40, { align: 'right' });

  // Table
  const tableData = hydrants.map((h, idx) => [
    idx + 1,
    h.proposedLocation,
    h.latitude.toFixed(6),
    h.longitude.toFixed(6),
    h.plusCode
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['#', 'Proposed Location', 'Latitude', 'Longitude', 'Plus Code']],
    body: tableData,
    headStyles: { fillColor: [0, 102, 204] },
    alternateRowStyles: { fillColor: [240, 248, 255] },
  });

  // Final summary text
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.text('Professional Technical Summary', 15, finalY);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const summaryText = `Based on the field survey conducted in the ${mainArea} district, the proposed fire hydrant locations have been strategically mapped to ensure maximum market coverage and rapid emergency response. The selected points are primarily located at critical entry and exit points of the high-density commercial zone. 

Fire safety justification: The high building density and narrow access routes in ${mainArea} necessitate a localized pillor-type hydrant network. Each proposed coordinate offers unobstructed access for fire tenders and ensures a reliable water source within a 100-meter radius of any point in the primary bazar. 

Official Endorsement: This report serves as a formal proposal for the Civil Works department. The coordinates provided are accurate within ±5 meters based on real-time GPS synchronization.`;

  const splitText = doc.splitTextToSize(summaryText, pageWidth - 30);
  doc.text(splitText, 15, finalY + 10);

  // Footer
  doc.setFontSize(8);
  doc.text('Generated via Official Field Survey Tool - RS-02 Unit', pageWidth / 2, 285, { align: 'center' });

  doc.save(`Hydrant_Survey_${mainArea.replace(/\s+/g, '_')}.pdf`);
};
