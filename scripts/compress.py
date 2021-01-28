import sys
import zlib
import binascii

args = sys.argv
def compress(path,zipped_path):
  d = open(path,'rb').read()
  compressed_data = zlib.compress(d, 2)
  f = open(zipped_path,'wb')
  f.write(compressed_data)
  f.close()

compress(args[1],args[2])
