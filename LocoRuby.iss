  [Setup]
  AppName=LocoRuby
  AppVersion=1.0
  DefaultDirName={pf}\LocoRuby
  DefaultGroupName=LocoRuby
  OutputBaseFilename=LocoRuby

  [Icons]
  Name: "{code:GetIconName}\{code:GetIconName}"; Filename: "{app}\locoruby.exe"; Parameters: "{code:GetCommandLineParameters}"
  Name: "{commonstartup}\{code:GetIconName}"; Filename: "{app}\locoruby.exe"; Parameters: "{code:GetCommandLineParameters}"
  Name: "{code:GetIconName}\Uninstall LocoRuby"; Filename: "{uninstallexe}"

  [Code]
var
  OptionsPage: TInputQueryWizardPage;
  
procedure InitializeWizard;
begin
  { Create the pages }

  OptionsPage := CreateInputQueryPage(wpWelcome,
    'Startup Options', 'The following options modify the behavior of the LocoRuby server.',
    'These values can be modified later by changing the shortcut properties.');
  OptionsPage.Add('Name: (Name as it appears on shortcut icons)', False);
  OptionsPage.Add('Port: (Which port will the server listen - make sure to open this port in the firewall)', False);
  OptionsPage.Add('Security Salt Key: (used to verify and encrypt data.  Must match value on your server.)', False);
  OptionsPage.Add('Auto Open URL on startup using default browser:', False);
  OptionsPage.values[0] := 'LocoRuby'
  OptionsPage.Values[1] := '8000';
  OptionsPage.Values[2] := '(No Key)';
  OptionsPage.Values[3] := '(No URL)';

end;

function GetCommandLineParameters(Param: String): String;
var 
  S: String;
begin
  { Build and Return the command line options }
  S := '-p' + OptionsPage.Values[1];
  if (OptionsPage.Values[2] <> '(No Key)')  and (OptionsPage.Values[2] <> '')  then
    S := S + ' -k"' + OptionsPage.Values[2] + '"';
  if (OptionsPage.Values[3] <> '(No URL)') and (OptionsPage.Values[3] <> '') then
    S := S + ' -o"' + OptionsPage.Values[3] + '"';
  Result := S;
end;

function GetIconName(Param: String) : String;
begin
  Result := OptionsPage.Values[0];
end;

function UpdateReadyMemo(Space, NewLine, MemoUserInfoInfo, MemoDirInfo, MemoTypeInfo,
  MemoComponentsInfo, MemoGroupInfo, MemoTasksInfo: String): String;
begin
  Result := 'Creating Program and Startup Folder short cut named ' + GetIconName('') + ' with these options: ' + NewLine + 
  GetCommandLineParameters('') + NewLine + MemoDirInfo + NewLine;
end;