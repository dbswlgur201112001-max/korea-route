const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block'});
for(const width of [360,390])test.describe(width+'px Scan & Translate',()=>{
  test.use({viewport:{width,height:844}});
  test.beforeEach(async({page})=>{
    await page.addInitScript(()=>{
      window.permissionCalls=[];
      const record=name=>()=>{permissionCalls.push(name);return Promise.reject(Error('Unexpected permission'));};
      Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:record('geo'),watchPosition:record('geo'),clearWatch:()=>{}}});
      Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:record('camera/mic')}});
      window.SpeechRecognition=window.webkitSpeechRecognition=class{start(){permissionCalls.push('mic');}stop(){}abort(){}};
    });
    await page.goto('/');await page.getByRole('button',{name:'Got it',exact:true}).click();
  });
  test('existing four tools open visibly, close/back works, no automatic media or analysis',async({page})=>{
    let choosers=0;const analyses=[];
    page.on('filechooser',()=>choosers++);page.on('request',r=>{if(/\/api\/(gemini|kiosk|check-ride)/.test(r.url()))analyses.push(r.url());});
    const choices=page.locator('#scanTranslateChoices');
    for(const [name,screen] of [['Translate text','translation'],['Two-way talk','twoWayTalkHub'],['Read a menu / kiosk','kioskHelpHub'],['Check my ride','moveHub']]){
      await page.locator('#home .v220-core-card').nth(2).click();await expect(choices).toBeVisible();
      await expect(choices.locator('button')).toHaveText(['Back','Translate text','Two-way talk','Read a menu / kiosk','Check my ride']);
      await choices.getByRole('button',{name,exact:true}).click();
      if(screen==='translation'){
        await expect(page.locator('#translateInput')).toBeVisible();await page.locator('#phraseSheetLayer .phrase-sheet-head button').click();
        await choices.getByRole('button',{name:'Back',exact:true}).click();
      }else if(screen==='moveHub'){
        await expect(page.locator('#checkRideLayer')).toBeVisible();await expect(page.locator('#checkRideTarget')).toBeVisible();
        await expect(page.locator('#checkRideLayer .checkride-note')).toContainText('not an official boarding confirmation');
        const box=await page.locator('#checkRideLayer').boundingBox();expect(box.width).toBeGreaterThan(0);
        await page.goBack();
        await choices.getByRole('button',{name:'Back',exact:true}).click();
      }else{
        await expect(page.locator('#'+screen)).toHaveClass(/active/);
        await expect(page.locator(screen==='twoWayTalkHub'?'#v180Body':'#v183Body')).toBeVisible();
        await page.locator('#'+screen+' .back').click();
        await expect(choices).toBeVisible();await choices.getByRole('button',{name:'Back',exact:true}).click();
      }
      await expect(page.locator('#home')).toHaveClass(/active/);
      expect(await page.evaluate(()=>permissionCalls)).toEqual([]);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
    }
    expect(choosers).toBe(0);expect(analyses).toEqual([]);
    await page.locator('#home .v220-core-card').nth(2).click();await expect(choices).toBeVisible();
    // V203 first closes the existing Help tool layer, then returns to Today.
    await page.goBack();await expect(choices).toBeHidden();await page.goBack();await expect(page.locator('#home')).toHaveClass(/active/);
  });
  test('EN KO JA choices and preserved Today sections',async({page})=>{
    await page.clock.setFixedTime(new Date('2026-09-27T03:00:00Z'));
    await page.evaluate(()=>{
      const trip={start:'Seoul',dest:'Suwon',date:'2026-09-27',days:3};sessionStorage.setItem('koreaRouteTrip',JSON.stringify(trip));localStorage.setItem('koreaRouteSavedTrip',JSON.stringify(trip));
      sessionStorage.setItem('koreaRouteSavedPlaces',JSON.stringify([{key:'a',en:'Palace',ko:'궁궐'}]));sessionStorage.setItem('koreaRouteSavedPlacePlan',JSON.stringify({a:{day:1,order:0}}));renderHomeTripSummary();
    });
    for(const labels of [['Back','Translate text','Two-way talk','Read a menu / kiosk','Check my ride'],['뒤로','글자 번역','양방향 대화','메뉴·키오스크 읽기','탑승 확인'],['戻る','テキスト翻訳','双方向会話','メニュー・キオスクを読む','乗車確認']]){
      for(const id of ['todayTripSummary','todayAssignedPlaces','globalSearchBox','nearbyEssentials'])await expect(page.locator('#'+id)).toBeVisible();
      await expect(page.locator('#todayTripSummary .today-plan-status')).toHaveAttribute('data-plan-state','IN_TRIP');
      await expect(page.locator('#todayAssignedPlaces [data-saved-key]')).toHaveCount(1);
      await expect(page.locator('#home .v220-core-card')).toHaveCount(4);await expect(page.locator('#v60Tabbar button')).toHaveCount(4);
      await page.locator('#home .v220-core-card').nth(2).click();const choices=page.locator('#scanTranslateChoices');await expect(choices).toBeVisible();
      await expect(choices.locator('button')).toHaveText(labels);
      if(labels[0]==='戻る')await expect(choices).not.toContainText(/Translate text|Two-way talk|Read a menu|Check my ride|Back|Close/);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
      await choices.getByRole('button',{name:labels[0],exact:true}).click();await page.locator('#langBtn').click();
    }
  });
});
