const link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild(link); // Firefox workaround

const saveBlob = (blob, filename) => {
  link.href = URL.createObjectURL( blob );
  link.download = filename;
  link.click();
  // URL.revokeObjectURL(url); breaks Firefox...
};

const saveArrayBuffer = (buffer, filename) => {
  saveBlob(new Blob([buffer], {type: 'application/octet-stream'}), filename);
};

export {
  saveBlob,
  saveArrayBuffer
};
