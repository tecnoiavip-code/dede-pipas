export const generatePixPayload = (amount: number, settings: { pixKey: string, pixName: string, pixCity: string }) => {
  if (!settings.pixKey) return '';
  
  const crc16 = (data: string) => {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
        else crc <<= 1;
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  };

  const formatField = (id: string, value: string) => id + value.length.toString().padStart(2, '0') + value;
  const merchantAccountInfo = formatField('00', 'br.gov.bcb.pix') + formatField('01', settings.pixKey);
  
  let payload = '000201';
  payload += formatField('26', merchantAccountInfo);
  payload += '52040000';
  payload += '5303986';
  if (amount > 0) payload += formatField('54', amount.toFixed(2));
  payload += '5802BR';
  payload += formatField('59', settings.pixName.substring(0, 25).toUpperCase());
  payload += formatField('60', settings.pixCity.substring(0, 15).toUpperCase());
  payload += '62070503***';
  payload += '6304';
  
  return payload + crc16(payload);
};
