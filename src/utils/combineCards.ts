const BACKEND_URL = 'https://gymvoicelog-stt-production.up.railway.app/combine';

/**
 * Combines multiple workout text entries into a single formatted entry using AI
 * @param texts Array of text strings to combine (in order)
 * @returns Combined formatted text string
 */
export async function combineCards(texts: string[]): Promise<string> {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'combineCards.ts:8',message:'combineCards called',data:{textsCount:texts?.length,texts:texts?.map(t=>t?.substring(0,50)),backendUrl:BACKEND_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E,F'})}).catch(()=>{});
  // #endregion
  if (!texts || texts.length < 2) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'combineCards.ts:11',message:'Validation failed - not enough texts',data:{textsCount:texts?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw new Error('At least 2 texts required to combine');
  }

  try {
    const requestBody = JSON.stringify({ texts });
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'combineCards.ts:18',message:'Before fetch request',data:{requestBodyLength:requestBody.length,backendUrl:BACKEND_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E,F'})}).catch(()=>{});
    // #endregion
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'combineCards.ts:28',message:'After fetch - response received',data:{status:response.status,statusText:response.statusText,ok:response.ok,headers:Object.fromEntries(response.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,D'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      let errorData;
      let errorText;
      try {
        errorText = await response.text();
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'combineCards.ts:35',message:'Response not ok - got error text',data:{status:response.status,errorText:errorText?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,D'})}).catch(()=>{});
        // #endregion
        try {
          errorData = JSON.parse(errorText);
        } catch (parseErr) {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'combineCards.ts:40',message:'Failed to parse error response as JSON',data:{parseError:parseErr?.message,errorText:errorText?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          errorData = { error: errorText || 'Unknown error' };
        }
      } catch (textErr) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'combineCards.ts:45',message:'Failed to read error response text',data:{textError:textErr?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        errorData = { error: 'Unknown error' };
      }
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'combineCards.ts:49',message:'Throwing error from non-ok response',data:{errorData,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,D'})}).catch(()=>{});
      // #endregion
      throw new Error(`Combine failed: ${errorData.error || response.statusText || 'Unknown error message'}`);
    }

    let result;
    try {
      const responseText = await response.text();
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'combineCards.ts:57',message:'Got response text',data:{responseTextLength:responseText?.length,responseTextPreview:responseText?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      result = JSON.parse(responseText);
    } catch (parseErr) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'combineCards.ts:61',message:'Failed to parse success response as JSON',data:{parseError:parseErr?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      throw new Error(`Failed to parse response: ${parseErr instanceof Error ? parseErr.message : 'Unknown parse error'}`);
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'combineCards.ts:66',message:'Parsed result',data:{hasCombinedText:!!result?.combinedText,combinedTextLength:result?.combinedText?.length,combinedTextPreview:result?.combinedText?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    if (!result.combinedText) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'combineCards.ts:70',message:'AI returned empty combined text',data:{result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      throw new Error('AI returned empty combined text');
    }

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'combineCards.ts:75',message:'combineCards success',data:{combinedTextLength:result.combinedText.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return result.combinedText;
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/87f89b92-c2e3-4982-b728-8e485b4ca737',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'combineCards.ts:79',message:'combineCards catch block',data:{errorType:err?.constructor?.name,errorMessage:err instanceof Error ? err.message : String(err),errorStack:err instanceof Error ? err.stack?.substring(0,300) : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E,F'})}).catch(()=>{});
    // #endregion
    console.error('Failed to combine cards:', err);
    throw err;
  }
}


