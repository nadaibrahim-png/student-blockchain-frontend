export function isProbablyHex32(s){
  if(typeof s !== 'string') return false;
  return /^0x[a-fA-F0-9]{64}$/.test(s);
}

export function isProbablyAddress(s){
  if(typeof s !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(s);
}
