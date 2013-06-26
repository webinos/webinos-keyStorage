{
  'variables': {
    'module_name': 'keystore'#Specify the module name here
  #you may override the variables found in node_module.gypi here or through command line
  },
  'targets': [
    {
      # Needed declarations for the target
      'target_name': '<(module_name)',
      'product_name':'<(module_name)',
    'sources': [ #Specify your source files here
      "src/KeyStoreException.h",
      "src/ksImpl.cpp",
      "src/ksImpl.h"
    ],
    'conditions': [
      [ 'OS=="mac"', {
        'sources': [
          'src/ksImpl_Darwin.cpp'
        ],
        'libraries': ['-g','-framework CoreFoundation','-framework Security','-lssl','-lcrypto', '-D_GNU_SOURCE'],
        'cflags!': [ '-fno-exceptions' ],
        'cflags_cc!': [ '-fno-exceptions' ],
        'xcode_settings': { 'GCC_ENABLE_CPP_EXCEPTIONS': 'YES' }
      }],
      [ 'OS=="win"', {
        'sources': [
          'src/ksImpl_NotImplemented.cpp'
        ]
      }],
      [ 'OS=="linux"', {
        'sources': [
          'src/ksImpl_Linux.cpp'
        ],
        'cflags': ['<!@(pkg-config --cflags --libs gnome-keyring-1)'], #call pkg-config to get the cflags
        'libraries': ['<!@(pkg-config --libs-only-l gnome-keyring-1)'], #call pkg-config to get the libraries
        'cflags!': [ '-fno-exceptions' ], #this is required to allow the class to throw exceptions
        'cflags_cc!': [ '-fno-exceptions' ]
      }]
    ],
    }, 
    {
    'target_name': 'webinos_wrt',
    'type': 'none',
    'toolsets': ['host'],
    'copies': [
      {
        'files': [
          '<(PRODUCT_DIR)/keystore.node',
        ],
        'destination': 'node_modules/',
      }],
    }, # end webinos_wrt
  ] # end targets
}

