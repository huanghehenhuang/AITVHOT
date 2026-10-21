import './setup.ts';
import assert from 'node:assert/strict';
import {after, test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {sql,closeDb} from '@aihot/backend/db';
import {loadPool} from '@aihot/backend/publication/pool';

after(closeDb);
test('pool folds confirmed reports before pagination, counting and both search sorts', async()=>{
  const prefix=randomUUID();
  const now=new Date('2026-10-16T08:00:00Z');
  const filters={channel:'all' as const,category:null,tag:prefix,now};
  await sql`INSERT INTO sources(id,name,kind,tier) VALUES (${prefix},'one','rss','T2'),(${prefix+'b'},'two','rss','T2')`;
  const [story]=await sql`INSERT INTO stories(public_id,title) VALUES (${randomUUID()},'test') RETURNING id`;
  const [fact]=await sql`INSERT INTO facts(public_id,story_id,title) VALUES (${prefix},${story!.id},'test') RETURNING id`;
  for(let i=0;i<44;i++){
    const id=prefix+i;
    const at=new Date(+now-i*60000);
    const source=i===1?prefix+'b':prefix;
    const grouped=i<3;
    await sql`INSERT INTO articles(id,source_id,identity_key,url,title,discovered_at,timeline_at)
      VALUES (${id},${source},${id},${'https://example.com/'+id},'needle',${at},${at})`;
    await sql`INSERT INTO publications(article_id,source_id,title,url,channel,tags,eligible,visibility,discovered_at,timeline_at,sort_at,fact_id,search_text)
      VALUES (${id},${source},'needle',${'https://example.com/'+id},'news',${[prefix]},true,'public',${at},${at},${at},${grouped?fact!.id:null},${i===1?'needle unique':'needle'})`;
    await sql`INSERT INTO pool_search(article_id,direct,body) VALUES (${id},${i===1?'needle unique':'needle'},'bodyneedle')`;
    if(grouped) await sql`INSERT INTO fact_articles(fact_id,article_id,role) VALUES (${fact!.id},${id},${i===2?'mention':'report'})`;
  }
  // Two confirmed reports become one; the third is only a mention and must stay independent.
  for(const search of [{},{q:'needle'},{q:'needle',tab:'relevance' as const}]){
    const first=await loadPool({...filters,...search});
    const second=await loadPool({...filters,...search,page:2});
    assert.equal(first.total,43);
    assert.equal(first.todayCount,43);
    assert.equal(first.items.length,40);
    assert.equal(second.items.length,3);
    assert.equal(first.pageCount,2);
    const ids=[...first.items,...second.items].map(i=>i.id);
    assert.equal(new Set(ids).size,43);
    assert.ok(ids.includes(prefix+2),'mention remains standalone');
    assert.equal(ids.filter(id=>id===prefix+0||id===prefix+1).length,1);
    const group=Object.values({...first.groups,...second.groups})[0]!;
    assert.deepEqual(group,{factId:prefix,reportCount:2,additionalSourceCount:1});
  }
  const unique=await loadPool({...filters,q:'unique'});
  assert.deepEqual(unique.items.map(i=>i.id),[prefix+1],'matching member survives even when another member is the default representative');
  await sql`UPDATE publications SET visibility='withdrawn' WHERE article_id=${prefix+1}`;
  const remaining=await loadPool(filters);
  assert.equal(remaining.total,43);
  assert.deepEqual(remaining.groups,{});
});
