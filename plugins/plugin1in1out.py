#!/usr/bin/env python
#
#                                                            _
# ABSTRACT BASE PLUGIN CLASS THAT IMPLEMENTS THE 1-INPUT-1-OUTPUT EXECUTION MODEL
#
# (c) 2012 Fetal-Neonatal Neuroimaging & Developmental Science Center
#                   Boston Children's Hospital
#
#              http://childrenshospital.org/FNNDSC/
#                        dev@babyMRI.org
#


# import the plugin.py superclass
import os, sys
sys.path.append(os.path.dirname(__file__))
from plugin import Plugin
#import utilities
import shutil, itertools, time
from tempfile import mkdtemp
sys.path.append(os.path.join(os.path.dirname(__file__), '../lib'))
from  _common import crun
from  _common import systemMisc as misc 


class Plugin1In1Out(Plugin):
    '''
      Base class for plugins with an execution model in which one output file is generated for each
      input (eg.Freesurfer plugins).
    '''

    def __init__(self):
        super(Plugin1In1Out, self).__init__()
        self.tempdir = ''
        # List of full paths to the input files
        self.inputFilePaths = []
        # List of output file names (just their names, not the full output path)
        self.outputFileNames = []
        
    def copyDataToTempDir(self):
        options = self.options
        # create temp dir and migrate data
        tempdir = mkdtemp('free', 'surf', self.envVars['ENV_CLUSTER_TMP_DIR'])
        if os.path.isfile(options.input) and options.input.endswith('dcm'):
          # copy the directory content 
          copyDir = os.path.dirname(options.input)
          shutil.copytree(copyDir, tempdir + '/mri/' + os.path.basename(copyDir))
        elif os.path.isfile(options.input) and not options.input.endswith('dcm'):
          copyDir = os.path.dirname(options.input)
          os.mkdir(tempdir + '/mri/')
          os.mkdir(tempdir + '/mri/' + os.path.basename(copyDir))
          shutil.copy(options.input, tempdir + '/mri/' + os.path.basename(copyDir))
        else:
          copyDir = options.input
          shutil.copytree(copyDir, tempdir + '/mri/' + os.path.basename(copyDir))
        self.tempdir = tempdir
        # set list of input file paths
        l_extensions = options.extensions.split(',')
        self.inputFilePaths = self.getFilePaths(self.tempdir + '/mri/', l_extensions)
        # set list of output file names
        for filePath in self.inputFilePaths:
          if filePath.endswith('dcm'):
            # the output file name is the parent directory name
            basename_new = os.path.basename(os.path.dirname(filePath)) + '.' + options.format
          else:
            # grab just the file name
            basename = os.path.splitext(os.path.basename(filePath))[0]
            # add output extension
            basename_new = basename + '.' + options.format
          self.outputFileNames.append(basename_new)
      
    def removeTempDir(self):
        shutil.rmtree(self.tempdir)

    def run(self):
        '''
        Execute this plugin (abstract method in this class).
        '''
        raise NotImplementedError("Plugin1In1Out.run()") 
    
    def execCmd(self, cmdList=None, userErrStr='Plugin returned error!'):
        """
        This method executes a list of commands (eg. mri_convert) either by scheduling them on a cluster
        or just running them locally depending on Chris configuration
        """
        if (cmdList is None):
            raise ValueError("A list of cmd strings must be passed on")
        cmdIds = []
        exitCodeFilePaths = [];
        chrisRunDir = self.chrisRunDir
        envFile = open(chrisRunDir + '/chris.env')
        envStr = envFile.read()
        envFile.close()
        clType = self.clusterType
        for cmd, outFileName in itertools.izip(cmdList, self.outputFileNames):  
          #create stderr, stdout, and exit code log for each cmd execution
          ix = outFileName.rfind('.')
          cmdId = outFileName[:ix]
          cmdIds.append(cmdId)
          out = '%s/%s' % (chrisRunDir, cmdId)
          exitCodeFilePaths.append(out + '-exitCode.log')
          if clType == 'local':
              cmd = '%s 2>%s.err >%s.std || (echo $? > %s-exitCode.log)' % (cmd, out, out, out)
          else:
              #write a dummy cmdId.log file too (this is used later to block the python process until all jobs have finished)
              cmd = '%s 2>%s.err >%s.std || (echo $? > %s-exitCode.log);touch %s.log' % (cmd, out, out, out, out)
          misc.file_writeOnce(out + '.run', envStr + '\n' + cmd)
          os.system('chmod 755 ' + out + '.run')
        if clType == 'local':
            #jobs are not scheduled on a cluster but run locally
            shell = crun.crun()
            shell.echo(False)
            shell.waitForChild(True)
            for cmdId in cmdIds:
                shell("/bin/bash " + chrisRunDir + '/' + cmdId + '.run')
        else:
            #jobs are scheduled on a cluster
            remUser = self.remoteUser
            remHost = self.remoteHost
            remUserId = self.remoteUserIdentity
            shell = eval('crun.' + clType.lower() + '(remoteUser=remUser, remoteHost=remHost, remoteUserIdentity=remUserId)')
            for cmdId in cmdIds:
              shell("/bin/bash " + chrisRunDir + '/' + cmdId + '.run', stdoutflush=True, stderrflush=True)
              time.sleep(0.5)
            #execute while loop until all cmds have written a file with a name cmdId.log in the chris run dir
            allHaveWritten = False
            while not allHaveWritten:
              dirList = os.listdir(chrisRunDir)
              #list of cmd ids found in the chris run dir 
              foundCmdIds = []
              for cmdId in cmdIds:
                for name in dirList:
                  if name == cmdId + '.log':
                    foundCmdIds.append(cmdId)
                    #remove found dummy log file
                    os.remove(chrisRunDir + '/' + name)
                    break;
              if len(foundCmdIds) == len(cmdIds):
                allHaveWritten = True
              else:
                for cmdId in foundCmdIds:
                  #remove already found ids
                  cmdIds.remove(cmdId)
                time.sleep(10)
        for path, outFileName in itertools.izip(exitCodeFilePaths, self.outputFileNames):  
          # check for existence of chrisRunDir/cmdId-exitCode.log
          if os.path.isfile(path):
            rfile = open(path)
            if rfile.read(1) == "0":
              shutil.copyfile(os.path.join(self.tempdir, outFileName), os.path.join(self.options.output, outFileName))
            else:
              ix = outFileName.rfind('.')
              misc.file_writeOnce(os.path.join(chrisRunDir, 'ERROR-user-' + outFileName[:ix] + '.err'), userErrStr + ' ' + outFileName)
            rfile.close()
          else:
            shutil.copyfile(os.path.join(self.tempdir, outFileName), os.path.join(self.options.output, outFileName))
            
