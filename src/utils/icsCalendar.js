function formatIcsUtc(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return '20261128T123000Z';
  }
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcsText(value = '') {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function buildLivestreamIcs(session) {
  const uid = `${session.id || Date.now()}@ocop-thanh-nien-dong-nai`;
  const dtStamp = formatIcsUtc(new Date());
  const dtStart = formatIcsUtc(session.startIso || '2026-11-28T19:30:00+07:00');
  const dtEnd = formatIcsUtc(session.endIso || '2026-11-28T21:00:00+07:00');
  const summary = `[Chợ OCOP Thanh Niên] ${session.productSummary || 'Phiên livestream tại vườn'}`;
  const location = session.location || session.producerName || 'Nhà vườn Ba Tư, Long Khánh, Đồng Nai';
  const description = [
    `Nhà vườn: ${session.producerName || 'Nhà vườn Ba Tư (Long Khánh)'}`,
    `Thanh niên hỗ trợ: ${session.supporterName || 'Đoàn viên thanh niên'}`,
    `Kênh dự kiến: ${session.channelLabel || 'Khung xem thử Chợ OCOP Thanh Niên'}`,
    `Ghi chú: ${session.note || 'Lịch nhắc hỗ trợ nông sản Đồng Nai (minh họa).'}`,
    'Lưu ý: Nhắc lịch trải nghiệm từ ứng dụng Chợ OCOP Thanh Niên Đồng Nai.'
  ].join('\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cho OCOP Thanh Nien Dong Nai//De 03//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `LOCATION:${escapeIcsText(location)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function downloadLivestreamIcs(session) {
  const icsContent = buildLivestreamIcs(session);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nhac-lich-livestream-${session.id || 'ocop'}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return icsContent;
}
