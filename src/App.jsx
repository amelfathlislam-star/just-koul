import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./supabaseClient";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// ─── ANIMATIONS ───
const fadeUp={hidden:{opacity:0,y:28},show:{opacity:1,y:0,transition:{duration:0.55,ease:[0.22,1,0.36,1]}}};
const fadeIn={hidden:{opacity:0},show:{opacity:1,transition:{duration:0.4}}};
const scaleIn={hidden:{opacity:0,scale:0.93},show:{opacity:1,scale:1,transition:{duration:0.4,ease:[0.22,1,0.36,1]}}};
const stagger={show:{transition:{staggerChildren:0.08}}};
const staggerFast={show:{transition:{staggerChildren:0.06}}};
const VP={once:true,margin:"-60px"};

// ─── DESIGN TOKENS ───
const C={
  cream:"#FDF8EE",lcream:"#FAF4E4",gold:"#C8873A",goldL:"#E8A555",
  green:"#2C4A1E",greenL:"#3D6B2C",brown:"#7B4F2E",
  text:"#2A1F14",textL:"#6B5240",white:"#FFFFFF",card:"#FFFDF5",
  red:"#C0392B",blue:"#2563EB",orange:"#D97706",purple:"#7C3AED",
  teal:"#0D9488",sidebar:"#111A0A",
};
const F={serif:"'Playfair Display',Georgia,serif",sans:"'Nunito',sans-serif"};

// ─── CONSTANTS ───
const SCHOOLS=[
  {id:"al-hanane",label:"École Al Hanane",extra:0},
  {id:"amal-school",label:"Amal School",extra:0},
  {id:"smart-school",label:"Smart School",extra:0},
  {id:"chrysalide",label:"La Chrysalide",extra:0},
  {id:"al-inbihat",label:"École Al Inbihat",extra:0},
  {id:"academie-bel-air",label:"Académie Bel Air",extra:0},
  {id:"autre",label:"Autre école (+30 DH)",extra:30},
];
const FORMULES=[
  {id:"unite",label:"À la commande"},{id:"semaine",label:"Forfait semaine"},
  {id:"mensuel",label:"Forfait mensuel"},{id:"trimestriel",label:"Forfait trimestriel"},
];
const PRICES={unite:{pe:49,cpd:56},semaine:{pe:176,cpd:200},mensuel:{pe:688,cpd:770},trimestriel:{pe:1950,cpd:2200}};
const DAYS=["lundi","mardi","mercredi","jeudi"];
const MONTHS=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MENU_SEMAINE=[
  {jour:"Lundi",plat:"Poulet rôti & riz pilaf",entree:"Salade fraîche du jour",dessert:"Yaourt maison",emoji:"🍗"},
  {jour:"Mardi",plat:"Lasagnes maison",entree:"Soupe de légumes",dessert:"Compote de saison",emoji:"🍝"},
  {jour:"Mercredi",plat:"Filet de poisson & purée",entree:"Crudités variées",dessert:"Fruit frais",emoji:"🐟"},
  {jour:"Jeudi",plat:"Tajine légumes & couscous",entree:"Chorba marocaine",dessert:"Panna cotta",emoji:"🫕"},
];
const TARIFS_PUBLIC=[
  {label:"À la commande",icon:"🥡",color:C.brown,options:[{desc:"Plat + entrée ou dessert",prix:"49 DH"},{desc:"Entrée + plat + dessert",prix:"56 DH"}],popular:false},
  {label:"Forfait semaine",icon:"📅",color:C.gold,options:[{desc:"Plat + entrée ou dessert",prix:"176 DH"},{desc:"Entrée + plat + dessert",prix:"200 DH"}],popular:false},
  {label:"Forfait mensuel",icon:"⭐",color:C.green,options:[{desc:"Plat + entrée ou dessert",prix:"688 DH"},{desc:"Entrée + plat + dessert",prix:"770 DH"}],popular:true},
  {label:"Forfait trimestriel",icon:"🏆",color:C.brown,options:[{desc:"Plat + entrée ou dessert",prix:"1 950 DH"},{desc:"Entrée + plat + dessert",prix:"2 200 DH"}],popular:false},
];
const HOLIDAYS={"2025-04-14":"Vacances","2025-04-15":"Vacances","2025-04-16":"Vacances","2025-04-17":"Vacances","2025-04-18":"Vacances","2025-04-19":"Vacances","2025-04-20":"Vacances","2025-04-21":"Vacances","2025-05-01":"Fête du Travail","2025-06-06":"Aïd Al-Adha","2025-06-07":"Aïd Al-Adha","2025-06-30":"Fin d'année"};

// ─── UTILS ───
const getSiblingDiscount=n=>n>=4?.30:n===3?.20:n===2?.10:0;
const calcPrice=(formule,repasType,nbChildren,school)=>{
  const unit=PRICES[formule]?.[repasType==="cpd"?"cpd":"pe"]||0;
  const base=unit*nbChildren;const discPct=getSiblingDiscount(nbChildren);
  const disc=base*discPct;const delivery=school==="autre"?30:0;
  return{unit,base,discPct,disc,delivery,total:base-disc+delivery};
};
const fmt=n=>Number(n).toFixed(0)+" DH";
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"k":String(n);
const todayStr=()=>new Date().toISOString().split("T")[0];
const pad=n=>String(n).padStart(2,"0");

// ─── EMAIL (RESEND) ───
async function sendEmail(to,subject,html){
  const key=import.meta.env.VITE_RESEND_API_KEY;
  if(!key||!to)return;
  try{
    await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},
      body:JSON.stringify({from:'Just Koul <onboarding@resend.dev>',to:[to],subject,html})
    });
  }catch(e){console.error('Resend error:',e);}
}
function emailHtmlVerif(prenom,code){
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#FDF8EE;border-radius:16px;overflow:hidden"><div style="background:#2C4A1E;padding:28px;text-align:center"><div style="font-size:28px;font-weight:800;color:#E8A555;letter-spacing:1px">JUST KOUL</div><div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:4px">Eat · Enjoy · Repeat</div></div><div style="padding:32px"><h2 style="color:#2C4A1E;font-size:20px;margin:0 0 16px">✅ Vérifiez votre adresse email</h2><p style="color:#6B5240;font-size:14px;line-height:1.7;margin:0 0 8px">Bonjour <strong>${prenom}</strong>,</p><p style="color:#6B5240;font-size:14px;line-height:1.7;margin:0 0 20px">Voici votre code de vérification :</p><div style="background:#2C4A1E;color:#E8A555;font-family:monospace;font-size:38px;font-weight:800;letter-spacing:12px;padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">${code}</div><p style="color:#6B5240;font-size:13px;margin:0 0 8px">Ce code expire dans <strong>15 minutes</strong>.</p><p style="color:#9E9387;font-size:12px;margin:0">Si vous n'avez pas créé de compte, ignorez cet email.</p></div><div style="background:#2C4A1E;padding:14px;text-align:center;font-size:11px;color:rgba(255,255,255,0.45)">Just Koul · Agadir · 06 33 95 87 60</div></div>`;
}
function emailHtmlConfirm(prenom,enroll){
  const formLabel=FORMULES.find(f=>f.id===enroll.formule)?.label||enroll.formule;
  const school=SCHOOLS.find(s=>s.id===enroll.school)?.label||enroll.school;
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#FDF8EE;border-radius:16px;overflow:hidden"><div style="background:#2C4A1E;padding:28px;text-align:center"><div style="font-size:28px;font-weight:800;color:#E8A555;letter-spacing:1px">JUST KOUL</div><div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:4px">Eat · Enjoy · Repeat</div></div><div style="padding:32px"><h2 style="color:#2C4A1E;font-size:20px;margin:0 0 16px">🎉 Votre inscription est confirmée !</h2><p style="color:#6B5240;font-size:14px;line-height:1.7;margin:0 0 8px">Bonjour <strong>${prenom}</strong>,</p><p style="color:#6B5240;font-size:14px;line-height:1.7;margin:0 0 16px">Votre inscription à la cantine <strong>Just Koul</strong> est confirmée !</p><div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid rgba(200,135,58,0.2)"><div style="font-size:13px;color:#6B5240;line-height:2.2"><div>📋 Formule : <strong>${formLabel}</strong></div><div>🏫 École : <strong>${school}</strong></div><div>👧 Enfants : <strong>${enroll.children.length}</strong></div><div>💰 Total : <strong>${enroll.amount} DH</strong></div></div></div><p style="color:#2C4A1E;font-weight:700;font-size:14px;margin:0 0 10px">Pour payer par virement :</p><div style="background:#F0F9F0;border-radius:10px;padding:14px;font-size:13px;color:#2C4A1E;line-height:2.2;margin-bottom:24px">🏦 Banque Populaire du Maroc<br/>RIB : <strong>101 810 0004800078601 34</strong><br/>Référence virement : <strong>${enroll.id}</strong></div><div style="text-align:center"><a href="https://just-koul.vercel.app" style="background:#2C4A1E;color:#fff;padding:12px 28px;border-radius:20px;text-decoration:none;font-weight:700;font-size:13px;display:inline-block">Accéder à mon espace →</a></div></div><div style="background:#2C4A1E;padding:14px;text-align:center;font-size:11px;color:rgba(255,255,255,0.45)">Just Koul · Agadir · 06 33 95 87 60</div></div>`;
}
function emailHtmlReset(code){
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#FDF8EE;border-radius:16px;overflow:hidden"><div style="background:#2C4A1E;padding:28px;text-align:center"><div style="font-size:28px;font-weight:800;color:#E8A555;letter-spacing:1px">JUST KOUL</div><div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:4px">Eat · Enjoy · Repeat</div></div><div style="padding:32px"><h2 style="color:#2C4A1E;font-size:20px;margin:0 0 16px">🔑 Réinitialisation de mot de passe</h2><p style="color:#6B5240;font-size:14px;line-height:1.7;margin:0 0 8px">Bonjour,</p><p style="color:#6B5240;font-size:14px;line-height:1.7;margin:0 0 20px">Voici votre code de réinitialisation :</p><div style="background:#2C4A1E;color:#E8A555;font-family:monospace;font-size:38px;font-weight:800;letter-spacing:12px;padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">${code}</div><p style="color:#6B5240;font-size:13px;margin:0 0 8px">Valable <strong>15 minutes</strong> uniquement.</p><p style="color:#9E9387;font-size:12px;margin:0">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p></div><div style="background:#2C4A1E;padding:14px;text-align:center;font-size:11px;color:rgba(255,255,255,0.45)">Just Koul · Agadir · 06 33 95 87 60</div></div>`;
}

// ─── WHATSAPP (CALLMEBOT) ───
async function sendWhatsApp(message){
  const phone=import.meta.env.VITE_WHATSAPP_ADMIN;
  const apikey=import.meta.env.VITE_CALLMEBOT_APIKEY;
  if(!phone||!apikey)return;
  try{await fetch(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apikey}`,{mode:'no-cors'});}
  catch(e){console.log('WhatsApp:',e);}
}

// ─── INITIAL DATA ───
const INIT={
  enrollments:[
    {id:"E001",parentNom:"Benali",parentPrenom:"Fatima",tel:"0612345678",email:"fatima@ex.com",school:"al-hanane",autreEcole:"",children:[{nom:"Benali",prenom:"Youssef",classe:"CE2"},{nom:"Benali",prenom:"Amina",classe:"CM1"}],formule:"mensuel",repasType:"pe",days:{lundi:true,mardi:true,mercredi:true,jeudi:false},status:"validated",payStatus:"paid",payMethod:"virement",amount:1238,discount:138,delivery:0,invoiceValidated:true,createdAt:"2025-04-01"},
    {id:"E002",parentNom:"Ouchane",parentPrenom:"Khalid",tel:"0699887766",email:"khalid@ex.com",school:"amal-school",autreEcole:"",children:[{nom:"Ouchane",prenom:"Rayan",classe:"6ème"}],formule:"semaine",repasType:"cpd",days:{lundi:true,mardi:true,mercredi:false,jeudi:true},status:"pending",payStatus:"pending",payMethod:"",amount:200,discount:0,delivery:0,invoiceValidated:false,createdAt:"2025-04-15"},
    {id:"E003",parentNom:"Alami",parentPrenom:"Nadia",tel:"0655443322",email:"nadia@ex.com",school:"chrysalide",autreEcole:"",children:[{nom:"Alami",prenom:"Sirine",classe:"5ème"},{nom:"Alami",prenom:"Adam",classe:"CM2"},{nom:"Alami",prenom:"Lina",classe:"CE1"}],formule:"trimestriel",repasType:"cpd",days:{lundi:true,mardi:true,mercredi:true,jeudi:true},status:"validated",payStatus:"paid",payMethod:"virement",amount:4620,discount:1540,delivery:0,invoiceValidated:true,createdAt:"2025-03-20"},
  ],
  orders:[
    {id:"O001",enrollId:"E001",date:"2025-04-07",menu:"Poulet rôti & riz pilaf",delivered:true,deliveredAt:"12:15",note:"RAS",childName:"Youssef Benali"},
    {id:"O002",enrollId:"E001",date:"2025-04-07",menu:"Poulet rôti & riz pilaf",delivered:true,deliveredAt:"12:17",note:"",childName:"Amina Benali"},
    {id:"O003",enrollId:"E001",date:"2025-04-08",menu:"Lasagnes maison",delivered:true,deliveredAt:"12:20",note:"",childName:"Youssef Benali"},
    {id:"O004",enrollId:"E001",date:"2025-04-08",menu:"Lasagnes maison",delivered:false,deliveredAt:"",note:"",childName:"Amina Benali"},
    {id:"O005",enrollId:"E002",date:"2025-04-07",menu:"Filet de poisson & purée",delivered:false,deliveredAt:"",note:"",childName:"Rayan Ouchane"},
    {id:"O006",enrollId:"E003",date:"2025-04-07",menu:"Poulet rôti & riz pilaf",delivered:true,deliveredAt:"12:30",note:"",childName:"Sirine Alami"},
    {id:"O007",enrollId:"E003",date:"2025-04-07",menu:"Poulet rôti & riz pilaf",delivered:true,deliveredAt:"12:31",note:"",childName:"Adam Alami"},
    {id:"O008",enrollId:"E003",date:"2025-04-08",menu:"Lasagnes maison",delivered:false,deliveredAt:"",note:"",childName:"Lina Alami"},
  ],
  monthMenus:[
    {id:"M001",month:4,year:2025,label:"Avril 2025",weeks:[
      {lundi:"Poulet rôti & riz pilaf",mardi:"Lasagnes maison",mercredi:"Filet de poisson & purée",jeudi:"Tajine légumes & couscous"},
      {lundi:"Pasta bolognaise",mardi:"Brochettes & frites",mercredi:"Omelette & salade",jeudi:"Riz aux légumes & poulet"},
      {lundi:"Vacances",mardi:"Vacances",mercredi:"Vacances",jeudi:"Vacances"},
      {lundi:"Cordon bleu & purée",mardi:"Spaghetti crevettes",mercredi:"Tajine kefta",jeudi:"Riz cantonais & poulet"},
    ]},
    {id:"M002",month:5,year:2025,label:"Mai 2025",weeks:[
      {lundi:"Poulet bbq & frites",mardi:"Lasagnes végétariennes",mercredi:"Poisson pané & riz",jeudi:"Tajine pruneaux"},
      {lundi:"Penne arrabbiata",mardi:"Escalope & purée",mercredi:"Briouat poulet & salade",jeudi:"Couscous du vendredi"},
      {lundi:"Poulet tikka & riz",mardi:"Gratin dauphinois",mercredi:"Pasta au saumon",jeudi:"Tajine olives & citron"},
      {lundi:"Burger maison & salade",mardi:"Macaroni gratinés",mercredi:"Poulet rôti & légumes",jeudi:"Couscous kefta"},
    ]},
  ],
  gallery:[{id:"G001",url:"",label:"Buffet mariage Agadir",date:"2025-03-15"},{id:"G002",url:"",label:"Vente privée Aïd",date:"2025-03-07"}],
  reviews:[
    {id:"R001",enrollId:"E001",parentNom:"Fatima B.",rating:5,text:"Les enfants adorent les repas ! Tout est frais et varié. Bravo Just Koul !",status:"approved",date:"2025-04-10"},
    {id:"R002",enrollId:"E002",parentNom:"Khalid O.",rating:4,text:"Très bon service, livraison ponctuelle. Je recommande vivement.",status:"pending",date:"2025-04-16"},
    {id:"R003",enrollId:"E003",parentNom:"Nadia A.",rating:5,text:"Mes 3 enfants sont ravis chaque jour. La qualité est constante et les menus variés.",status:"approved",date:"2025-04-05"},
  ],
  quotes:[
    {id:"Q001",nom:"Rachid Amrani",tel:"0661234567",email:"rachid@ex.com",typeEvent:"Mariage",date:"2025-06-14",nbPersonnes:120,budget:"10 000 DH",message:"Buffet complet mariage, cuisine marocaine et internationale.",status:"confirmed",createdAt:"2025-04-12",
     items:[{desc:"Buffet marocain complet",qty:120,unit:45,total:5400},{desc:"Cocktail dînatoire",qty:120,unit:22,total:2640},{desc:"Décoration table",qty:1,unit:960,total:960}],total:9000,deposit:2500,depositPaid:true,notes:"Pas d'alcool, halal"},
    {id:"Q002",nom:"Sara Idrissi",tel:"0677889900",email:"sara@corp.ma",typeEvent:"Corporate",date:"2025-05-20",nbPersonnes:40,budget:"3 000 DH",message:"Déjeuner d'équipe mensuel, formule finger food.",status:"new",createdAt:"2025-04-08",
     items:[{desc:"Finger food varié",qty:40,unit:55,total:2200},{desc:"Jus frais maison",qty:40,unit:15,total:600}],total:2800,deposit:0,depositPaid:false,notes:""},
    {id:"Q003",nom:"Ahmed Tazi",tel:"0644332211",email:"ahmed@event.ma",typeEvent:"Anniversaire",date:"2025-05-10",nbPersonnes:60,budget:"4 000 DH",message:"Buffet anniversaire 40 ans, ambiance festive.",status:"replied",createdAt:"2025-04-05",
     items:[{desc:"Buffet chaud/froid",qty:60,unit:50,total:3000},{desc:"Gâteau maison",qty:1,unit:450,total:450},{desc:"Jus & boissons",qty:60,unit:12,total:720}],total:4170,deposit:1000,depositPaid:true,notes:"Thème doré"},
  ],
  // ─── NEW DATA ───
  team:[
    {id:"T001",nom:"Benali",prenom:"Aicha",role:"Cuisinière principale",tel:"0661234500",email:"aicha@justkoul.ma",status:"active",avatar:"👩‍🍳",schedule:{lundi:true,mardi:true,mercredi:true,jeudi:true,vendredi:false},salary:3500,startDate:"2024-09-01",note:"Spécialiste tajines et plats marocains"},
    {id:"T002",nom:"Raji",prenom:"Omar",role:"Livreur",tel:"0662345600",email:"omar@justkoul.ma",status:"active",avatar:"🛵",schedule:{lundi:true,mardi:true,mercredi:true,jeudi:true,vendredi:false},salary:2800,startDate:"2024-10-01",note:"Zone: Al Hanane, Al Inbihat"},
    {id:"T003",nom:"Idrissi",prenom:"Sara",role:"Assistante cuisine",tel:"0663456700",email:"sara@justkoul.ma",status:"active",avatar:"👩‍🍳",schedule:{lundi:true,mardi:true,mercredi:false,jeudi:true,vendredi:false},salary:2800,startDate:"2025-01-15",note:"Spécialiste desserts et pâtisseries"},
    {id:"T004",nom:"Cherkaoui",prenom:"Hamid",role:"Livreur",tel:"0664567800",email:"hamid@justkoul.ma",status:"off",avatar:"🛵",schedule:{lundi:false,mardi:false,mercredi:true,jeudi:true,vendredi:false},salary:2800,startDate:"2025-02-01",note:"Zone: Salsabil, La Chrysalide"},
    {id:"T005",nom:"Tazi",prenom:"Leila",role:"Commerciale",tel:"0665678900",email:"leila@justkoul.ma",status:"active",avatar:"👩‍💼",schedule:{lundi:true,mardi:true,mercredi:true,jeudi:true,vendredi:true},salary:4000,startDate:"2024-11-01",note:"Gestion clients & devis événementiels"},
  ],
  tasks:[
    {id:"TK001",title:"Préparer menus semaine 18",assignee:"T001",dueDate:"2025-04-25",status:"done",priority:"high"},
    {id:"TK002",title:"Commande poulet fournisseur Hassan",assignee:"T005",dueDate:"2025-04-26",status:"pending",priority:"high"},
    {id:"TK003",title:"Livraisons Al Hanane + Al Inbihat",assignee:"T002",dueDate:"2025-04-25",status:"in_progress",priority:"high"},
    {id:"TK004",title:"Préparer devis mariage Amrani",assignee:"T005",dueDate:"2025-04-27",status:"pending",priority:"medium"},
    {id:"TK005",title:"Inventaire stocks fin de semaine",assignee:"T003",dueDate:"2025-04-26",status:"pending",priority:"medium"},
    {id:"TK006",title:"Livraisons Salsabil + Chrysalide",assignee:"T004",dueDate:"2025-04-25",status:"pending",priority:"high"},
  ],
  stock:[
    {id:"S001",name:"Poulet frais",category:"Protéines",unit:"kg",qty:8,minQty:10,costUnit:48,supplier:"Chez Hassan Marché",lastUpdated:"2025-04-24"},
    {id:"S002",name:"Riz basmati",category:"Féculents",unit:"kg",qty:22,minQty:8,costUnit:18,supplier:"Grossiste Agadir",lastUpdated:"2025-04-22"},
    {id:"S003",name:"Pâtes (diverses)",category:"Féculents",unit:"kg",qty:15,minQty:5,costUnit:12,supplier:"Grossiste Agadir",lastUpdated:"2025-04-22"},
    {id:"S004",name:"Tomates fraîches",category:"Légumes",unit:"kg",qty:6,minQty:5,costUnit:8,supplier:"Marché Agadir",lastUpdated:"2025-04-24"},
    {id:"S005",name:"Pommes de terre",category:"Légumes",unit:"kg",qty:30,minQty:10,costUnit:5,supplier:"Marché Agadir",lastUpdated:"2025-04-22"},
    {id:"S006",name:"Oignons",category:"Légumes",unit:"kg",qty:12,minQty:5,costUnit:4,supplier:"Marché Agadir",lastUpdated:"2025-04-22"},
    {id:"S007",name:"Huile d'olive",category:"Condiments",unit:"L",qty:5,minQty:4,costUnit:65,supplier:"Coopérative Tiznit",lastUpdated:"2025-04-20"},
    {id:"S008",name:"Farine",category:"Épicerie",unit:"kg",qty:18,minQty:10,costUnit:9,supplier:"Grossiste Agadir",lastUpdated:"2025-04-20"},
    {id:"S009",name:"Filet de poisson",category:"Protéines",unit:"kg",qty:3,minQty:6,costUnit:65,supplier:"Marché poissons Agadir",lastUpdated:"2025-04-24"},
    {id:"S010",name:"Œufs",category:"Protéines",unit:"unité",qty:120,minQty:60,costUnit:1.5,supplier:"Ferme locale",lastUpdated:"2025-04-23"},
    {id:"S011",name:"Fromage (râpé)",category:"Produits laitiers",unit:"kg",qty:2,minQty:2,costUnit:85,supplier:"Centrale laitière",lastUpdated:"2025-04-22"},
    {id:"S012",name:"Citrons",category:"Fruits",unit:"kg",qty:5,minQty:3,costUnit:10,supplier:"Marché Agadir",lastUpdated:"2025-04-24"},
    {id:"S013",name:"Herbes fraîches (mix)",category:"Condiments",unit:"botte",qty:8,minQty:5,costUnit:8,supplier:"Marché Agadir",lastUpdated:"2025-04-24"},
    {id:"S014",name:"Boîtes repas (noires)",category:"Emballages",unit:"unité",qty:150,minQty:100,costUnit:2.5,supplier:"Fournisseur emballages",lastUpdated:"2025-04-20"},
    {id:"S015",name:"Sacs kraft",category:"Emballages",unit:"unité",qty:80,minQty:50,costUnit:3,supplier:"Fournisseur emballages",lastUpdated:"2025-04-20"},
  ],
  invoices:[
    {id:"INV001",enrollId:"E001",type:"cantine",clientNom:"Fatima Benali",clientTel:"0612345678",issueDate:"2025-04-01",dueDate:"2025-04-15",paidDate:"2025-04-12",status:"paid",items:[{desc:"Forfait mensuel Cantine - 2 enfants",qty:1,unit:1376,total:1376},{desc:"Réduction fratrie 10%",qty:1,unit:-138,total:-138}],subtotal:1376,discount:138,total:1238,notes:""},
    {id:"INV002",enrollId:"E002",type:"cantine",clientNom:"Khalid Ouchane",clientTel:"0699887766",issueDate:"2025-04-15",dueDate:"2025-04-30",paidDate:"",status:"pending",items:[{desc:"Forfait semaine Cantine - 1 enfant",qty:1,unit:200,total:200}],subtotal:200,discount:0,total:200,notes:""},
    {id:"INV003",quoteId:"Q001",type:"evenement",clientNom:"Rachid Amrani",clientTel:"0661234567",issueDate:"2025-04-14",dueDate:"2025-05-14",paidDate:"",status:"partial",items:[{desc:"Buffet marocain complet x120",qty:120,unit:45,total:5400},{desc:"Cocktail dînatoire x120",qty:120,unit:22,total:2640},{desc:"Décoration table",qty:1,unit:960,total:960}],subtotal:9000,discount:0,total:9000,deposit:2500,depositPaid:true,notes:"Acompte 2500 DH reçu le 14/04/2025"},
    {id:"INV004",enrollId:"E003",type:"cantine",clientNom:"Nadia Alami",clientTel:"0655443322",issueDate:"2025-03-20",dueDate:"2025-04-05",paidDate:"2025-03-28",status:"paid",items:[{desc:"Forfait trimestriel Cantine - 3 enfants",qty:1,unit:6600,total:6600},{desc:"Réduction fratrie 20%",qty:1,unit:-1320,total:-1320},{desc:"Réduction fidélité",qty:1,unit:-220,total:-220}],subtotal:6600,discount:1540,total:4620,notes:"Réduction fidélité client"},
  ],
  revenueWeekly:[38,55,42,68,72,85,61],
  revenueMonthly:[3200,4100,3800,5200,4900,6100,5500,4800,6800,7200,6500,8100],
};

// ─── ÉTAT INITIAL VIDE (Supabase est la seule source de vérité) ───
const EMPTY={
  enrollments:[],orders:[],monthMenus:[],gallery:[],reviews:[],
  quotes:[],team:[],tasks:[],stock:[],invoices:[],
  revenueWeekly:INIT.revenueWeekly,revenueMonthly:INIT.revenueMonthly,
};

// ─── SUPABASE FIELD TRANSFORMERS (snake_case ↔ camelCase) ───
const tE=r=>({id:r.id,parentNom:r.parent_nom||'',parentPrenom:r.parent_prenom||'',tel:r.tel||'',email:r.email||'',school:r.school||'al-hanane',autreEcole:r.autre_ecole||'',children:r.children||[],formule:r.formule||'mensuel',repasType:r.repas_type||'pe',days:r.days||{},status:r.status||'pending',payStatus:r.pay_status||'pending',payMethod:r.pay_method||'',amount:r.amount||0,discount:r.discount||0,delivery:r.delivery||0,invoiceValidated:r.invoice_validated||false,notes:r.notes||'',createdAt:(r.created_at||'').split('T')[0]});
const fE=e=>({parent_nom:e.parentNom,parent_prenom:e.parentPrenom,tel:e.tel,email:e.email,school:e.school,autre_ecole:e.autreEcole,children:e.children,formule:e.formule,repas_type:e.repasType,days:e.days,status:e.status,pay_status:e.payStatus,pay_method:e.payMethod,amount:e.amount,discount:e.discount,delivery:e.delivery,invoice_validated:e.invoiceValidated,notes:e.notes});
const tO=r=>({id:r.id,enrollId:r.enroll_id,date:r.date||'',menu:r.menu||'',delivered:r.delivered||false,deliveredAt:r.delivered_at||'',note:r.note||'',childName:r.child_name||''});
const tQ=r=>({id:r.id,nom:r.nom||'',tel:r.tel||'',email:r.email||'',typeEvent:r.type_event||'',date:r.date||'',nbPersonnes:r.nb_personnes||'',budget:r.budget||'',message:r.message||'',status:r.status||'new',createdAt:(r.created_at||'').split('T')[0],items:r.items||[],total:r.total||0,deposit:r.deposit||0,depositPaid:r.deposit_paid||false,notes:r.notes||''});
const fQ=q=>({nom:q.nom,tel:q.tel,email:q.email||'',type_event:q.typeEvent||'',date:q.date||null,nb_personnes:q.nbPersonnes?Number(q.nbPersonnes):null,budget:q.budget||'',message:q.message||'',status:q.status||'new',items:q.items||[],total:q.total||0,deposit:q.deposit||0,deposit_paid:q.depositPaid||false,notes:q.notes||''});
const tI=r=>({id:r.id,enrollId:r.enroll_id,quoteId:r.quote_id,type:r.type||'cantine',clientNom:r.client_nom||'',clientTel:r.client_tel||'',issueDate:r.issue_date||'',dueDate:r.due_date||'',paidDate:r.paid_date||'',status:r.status||'pending',items:r.items||[],subtotal:r.subtotal||0,discount:r.discount||0,total:r.total||0,deposit:r.deposit||0,depositPaid:r.deposit_paid||false,notes:r.notes||''});
const tS=r=>({id:r.id,name:r.name||'',category:r.category||'',unit:r.unit||'kg',qty:r.qty||0,minQty:r.min_qty||0,costUnit:r.cost_unit||0,supplier:r.supplier||'',lastUpdated:(r.last_updated||'').split('T')[0]});
const fS=s=>({name:s.name,category:s.category,unit:s.unit,qty:s.qty,min_qty:s.minQty,cost_unit:s.costUnit,supplier:s.supplier,last_updated:new Date().toISOString()});
const tT=r=>({id:r.id,nom:r.nom||'',prenom:r.prenom||'',role:r.role||'',tel:r.tel||'',email:r.email||'',status:r.status||'active',avatar:r.avatar||'👤',schedule:r.schedule||{},salary:r.salary||0,startDate:r.start_date||'',note:r.note||''});
const fT=m=>({nom:m.nom,prenom:m.prenom,role:m.role,tel:m.tel,email:m.email,status:m.status,avatar:m.avatar,schedule:m.schedule,salary:m.salary,start_date:m.startDate||null,note:m.note});
const tTk=r=>({id:r.id,title:r.title||'',assignee:r.assignee,dueDate:r.due_date||'',status:r.status||'pending',priority:r.priority||'medium'});
const fTk=t=>({title:t.title,assignee:t.assignee||null,due_date:t.dueDate||null,status:t.status,priority:t.priority});
const tM=r=>({id:r.id,month:r.month,year:r.year,label:r.label||'',weeks:r.weeks||[]});
const tR=r=>({id:r.id,enrollId:r.enroll_id,parentNom:r.parent_nom||'',rating:r.rating||0,text:r.text||'',status:r.status||'pending',date:r.date||''});
const fR=r=>({enroll_id:r.enrollId||null,parent_nom:r.parentNom,rating:r.rating,text:r.text,status:r.status||'pending',date:r.date});
const tG=r=>({id:r.id,url:r.url||'',label:r.label||'',date:r.date||''});

async function loadAllData(){
  const [en,or,mm,gal,rev,qt,tm,tk,st,inv]=await Promise.all([
    supabase.from('enrollments').select('*').order('created_at',{ascending:false}),
    supabase.from('orders').select('*').order('date',{ascending:false}),
    supabase.from('month_menus').select('*').order('year').order('month'),
    supabase.from('gallery').select('*').order('date',{ascending:false}),
    supabase.from('reviews').select('*').order('date',{ascending:false}),
    supabase.from('quotes').select('*').order('created_at',{ascending:false}),
    supabase.from('team').select('*'),
    supabase.from('tasks').select('*'),
    supabase.from('stock').select('*'),
    supabase.from('invoices').select('*').order('issue_date',{ascending:false}),
  ]);
  return {
    enrollments:(en.data||[]).map(tE),
    orders:(or.data||[]).map(tO),
    monthMenus:(mm.data||[]).map(tM),
    gallery:(gal.data||[]).map(tG),
    reviews:(rev.data||[]).map(tR),
    quotes:(qt.data||[]).map(tQ),
    team:(tm.data||[]).map(tT),
    tasks:(tk.data||[]).map(tTk),
    stock:(st.data||[]).map(tS),
    invoices:(inv.data||[]).map(tI),
    revenueWeekly:INIT.revenueWeekly,
    revenueMonthly:INIT.revenueMonthly,
  };
}

// ═══════════════════════════════════════
//   SHARED UI COMPONENTS
// ═══════════════════════════════════════
function Btn({children,onClick,variant="primary",small,full,disabled,style={}}){
  const base={fontFamily:F.sans,fontWeight:700,cursor:disabled?"not-allowed":"pointer",border:"none",
    borderRadius:small?14:22,padding:small?"6px 14px":"11px 24px",fontSize:small?12:14,
    transition:"all 0.2s",width:full?"100%":undefined,opacity:disabled?0.5:1,...style};
  const v={
    primary:{background:C.green,color:C.white,boxShadow:`0 4px 14px rgba(44,74,30,0.25)`},
    gold:{background:C.gold,color:C.white,boxShadow:`0 4px 14px rgba(200,135,58,0.3)`},
    outline:{background:"transparent",color:C.green,border:`2px solid ${C.green}`},
    danger:{background:C.red,color:C.white,boxShadow:`0 4px 14px rgba(192,57,43,0.25)`},
    ghost:{background:"rgba(44,74,30,0.08)",color:C.green},
    white:{background:C.white,color:C.green,boxShadow:`0 4px 14px rgba(0,0,0,0.1)`},
    blue:{background:C.blue,color:C.white},
  };
  return <button disabled={disabled} style={{...base,...v[variant]}} onClick={onClick}
    onMouseOver={e=>{if(!disabled)e.currentTarget.style.transform="translateY(-1px)"}}
    onMouseOut={e=>e.currentTarget.style.transform="translateY(0)"}>{children}</button>;
}
function Badge({label,color=C.gold,dot}){
  return <span style={{fontFamily:F.sans,fontSize:11,fontWeight:800,letterSpacing:0.4,background:color+"20",color,borderRadius:20,padding:"3px 10px",whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:4}}>
    {dot&&<span style={{width:6,height:6,borderRadius:"50%",background:color,display:"inline-block"}}/>}{label}
  </span>;
}
function Card({children,style={},onClick}){
  return <div onClick={onClick} style={{background:C.card,borderRadius:18,border:`1px solid rgba(200,135,58,0.12)`,padding:"1.4rem",boxShadow:"0 2px 12px rgba(0,0,0,0.04)",cursor:onClick?"pointer":undefined,transition:"box-shadow 0.2s",...style}}
    onMouseOver={e=>{if(onClick)e.currentTarget.style.boxShadow="0 8px 28px rgba(0,0,0,0.1)"}}
    onMouseOut={e=>{if(onClick)e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.04)"}}>
    {children}
  </div>;
}
function STitle({icon,label,title,action}){
  return <div style={{marginBottom:"1.5rem",display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
    <div>
      <div style={{fontFamily:F.sans,fontSize:10,fontWeight:800,letterSpacing:3,textTransform:"uppercase",color:C.gold,marginBottom:5}}>{icon} {label}</div>
      <h2 style={{fontFamily:F.serif,fontSize:"clamp(1.4rem,2.5vw,1.9rem)",color:C.green,margin:0}}>{title}</h2>
    </div>
    {action&&<div>{action}</div>}
  </div>;
}
function Inp({label,value,onChange,type="text",placeholder,options,required,hint}){
  const s={width:"100%",padding:"10px 13px",fontFamily:F.sans,fontSize:13,background:C.white,color:C.text,border:`1.5px solid rgba(200,135,58,0.28)`,borderRadius:10,outline:"none",boxSizing:"border-box"};
  return <div style={{marginBottom:14}}>
    <label style={{fontFamily:F.sans,fontWeight:700,fontSize:11,color:C.green,display:"block",marginBottom:5,letterSpacing:0.3}}>{label}{required&&<span style={{color:C.red}}> *</span>}</label>
    {type==="select"?<select style={s} value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.id||o} value={o.id||o}>{o.label||o}</option>)}</select>
    :type==="textarea"?<textarea style={{...s,minHeight:80,resize:"vertical"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
    :<input style={s} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>}
    {hint&&<div style={{fontSize:11,color:C.textL,marginTop:4}}>{hint}</div>}
  </div>;
}
function Stars({rating,onChange}){
  return <div style={{display:"flex",gap:3}}>
    {[1,2,3,4,5].map(s=><span key={s} onClick={()=>onChange&&onChange(s)} style={{fontSize:20,cursor:onChange?"pointer":"default",color:s<=rating?C.gold:"#DDD"}}>★</span>)}
  </div>;
}
function Toast({msg,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[onClose]);
  return <motion.div initial={{opacity:0,y:40,scale:0.9}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:40}}
    style={{position:"fixed",bottom:28,right:28,background:C.green,color:C.white,padding:"13px 22px",borderRadius:18,
      fontFamily:F.sans,fontWeight:700,fontSize:13,zIndex:9999,boxShadow:"0 8px 32px rgba(44,74,30,0.35)",maxWidth:320,cursor:"pointer"}}
    onClick={onClose}>{msg}</motion.div>;
}
function StatusBadge({status}){
  const m={
    pending:{label:"En attente",color:C.orange},validated:{label:"Validé",color:"#16A34A"},
    rejected:{label:"Refusé",color:C.red},paid:{label:"Payé ✓",color:"#16A34A"},
    partial:{label:"Acompte",color:C.purple},overdue:{label:"En retard",color:C.red},
    new:{label:"Nouveau",color:C.blue},replied:{label:"Répondu",color:C.teal},
    approved:{label:"Publié",color:"#16A34A"},confirmed:{label:"Confirmé",color:"#16A34A"},
    done:{label:"Terminé",color:C.green},in_progress:{label:"En cours",color:C.blue},
    cancelled:{label:"Annulé",color:C.red},active:{label:"Actif",color:"#16A34A"},
    off:{label:"Congé",color:C.orange},sick:{label:"Maladie",color:C.red},
    low:{label:"Stock bas",color:C.red},ok:{label:"OK",color:"#16A34A"},
  };
  const t=m[status]||{label:status,color:C.textL};
  return <Badge label={t.label} color={t.color} dot/>;
}
function KpiCard({icon,label,value,sub,color=C.green,trend}){
  return <Card style={{padding:"1.2rem"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <div style={{width:44,height:44,borderRadius:14,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{icon}</div>
      {trend&&<span style={{fontSize:11,fontWeight:800,color:trend>0?"#16A34A":C.red}}>{trend>0?"↑":trend<0?"↓":"→"} {Math.abs(trend)}%</span>}
    </div>
    <div style={{fontFamily:F.serif,fontWeight:700,fontSize:26,color,marginTop:12,lineHeight:1}}>{value}</div>
    <div style={{fontFamily:F.sans,fontWeight:700,fontSize:12,color:C.textL,marginTop:4}}>{label}</div>
    {sub&&<div style={{fontSize:11,color:C.textL,marginTop:2}}>{sub}</div>}
  </Card>;
}
function MiniBarChart({data,label,color=C.gold}){
  const max=Math.max(...data)||1;
  return <Card>
    <div style={{fontFamily:F.sans,fontWeight:700,fontSize:12,color:C.textL,marginBottom:14}}>{label}</div>
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>
      {data.map((v,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <motion.div initial={{height:0}} animate={{height:`${(v/max)*72}px`}} transition={{duration:0.8,delay:i*0.05,ease:[0.22,1,0.36,1]}}
            style={{width:"100%",background:i===data.length-1?C.green:color,borderRadius:"4px 4px 0 0",minHeight:3}}/>
          <span style={{fontFamily:F.sans,fontSize:9,color:C.textL}}>{["L","M","M","J","V","S","D"][i]}</span>
        </div>
      ))}
    </div>
    <div style={{fontFamily:F.sans,fontWeight:700,fontSize:12,color:C.green,marginTop:8}}>
      Total semaine : {fmt(data.reduce((a,b)=>a+b*10,0))}
    </div>
  </Card>;
}
function Modal({title,onClose,children,wide}){
  return <div style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <motion.div initial={{opacity:0,scale:0.93,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:10}} transition={{duration:0.3,ease:[0.22,1,0.36,1]}}
      style={{background:C.cream,borderRadius:22,width:"100%",maxWidth:wide?780:520,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.3)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"1.5rem 1.5rem 0"}}>
        <h3 style={{fontFamily:F.serif,fontSize:20,color:C.green,margin:0}}>{title}</h3>
        <button onClick={onClose} style={{background:"rgba(44,74,30,0.08)",border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:16,color:C.green}}>✕</button>
      </div>
      <div style={{padding:"1.2rem 1.5rem 1.5rem"}}>{children}</div>
    </motion.div>
  </div>;
}
function EmptyState({icon,title,sub}){
  return <div style={{textAlign:"center",padding:"3rem 1rem",color:C.textL}}>
    <div style={{fontSize:48,marginBottom:12}}>{icon}</div>
    <div style={{fontFamily:F.serif,fontSize:18,color:C.green,marginBottom:6}}>{title}</div>
    <div style={{fontFamily:F.sans,fontSize:13}}>{sub}</div>
  </div>;
}
function THead({cols}){
  return <thead><tr style={{background:`linear-gradient(90deg,${C.green},${C.greenL})`}}>
    {cols.map((c,i)=><th key={i} style={{padding:"11px 14px",color:C.white,fontSize:11,fontWeight:700,textAlign:"left",letterSpacing:0.5,textTransform:"uppercase",whiteSpace:"nowrap"}}>{c}</th>)}
  </tr></thead>;
}
function TRow({cells,even,onClick,actions}){
  return <tr style={{background:even?C.lcream:C.white,cursor:onClick?"pointer":undefined,transition:"background 0.15s"}}
    onMouseOver={e=>{if(onClick)e.currentTarget.style.background="#FFF3DC"}}
    onMouseOut={e=>{e.currentTarget.style.background=even?C.lcream:C.white}}
    onClick={onClick}>
    {cells.map((c,i)=><td key={i} style={{padding:"11px 14px",fontSize:13,color:C.text,borderBottom:`1px solid rgba(200,135,58,0.08)`,verticalAlign:"middle"}}>{c}</td>)}
    {actions&&<td style={{padding:"8px 14px",borderBottom:`1px solid rgba(200,135,58,0.08)`,whiteSpace:"nowrap"}}>{actions}</td>}
  </tr>;
}

// ═══════════════════════════════════════
//   LOGIN MODAL
// ═══════════════════════════════════════
function LoginModal({onLogin,onClose,data}){
  const [view,setView]=useState("login");
  // login
  const [identifier,setIdentifier]=useState("");
  const [pwd,setPwd]=useState("");
  const [err,setErr]=useState("");
  const [busy,setBusy]=useState(false);
  // signup
  const [sf,setSf]=useState({prenom:"",nom:"",email:"",tel:"",pwd:"",pwd2:""});
  const [sErr,setSErr]=useState("");
  const [sBusy,setSBusy]=useState(false);
  const [sOk,setSOk]=useState("");
  // forgot
  const [fEmail,setFEmail]=useState("");
  const [fMsg,setFMsg]=useState("");
  const [fBusy,setFBusy]=useState(false);
  // verify (signup + forgot)
  const [verfCode,setVerfCode]=useState("");
  const [verfExpiry,setVerfExpiry]=useState(0);
  const [verfInput,setVerfInput]=useState("");
  const [verfErr,setVerfErr]=useState("");
  const [verfBusy,setVerfBusy]=useState(false);

  const doLogin=async()=>{
    if(!identifier.trim()||!pwd){setErr("Remplissez tous les champs");return;}
    setBusy(true);setErr("");
    const id=identifier.trim().toLowerCase();
    if(id==="admin"){
      if(pwd===import.meta.env.VITE_ADMIN_PASSWORD){onLogin("admin");return;}
      setErr("Mot de passe incorrect");setBusy(false);return;
    }
    if(id==="livreur"){
      if(pwd===import.meta.env.VITE_LIVREUR_PASSWORD){onLogin("livreur");return;}
      setErr("Mot de passe incorrect");setBusy(false);return;
    }
    const found=(data?.enrollments||[]).find(e=>e.parentNom.toLowerCase()===id||e.email.toLowerCase()===id);
    if(found){
      if(pwd==="parent123"){onLogin("parent");return;}
      const{error}=await supabase.auth.signInWithPassword({email:found.email,password:pwd});
      if(!error){onLogin("parent");return;}
      setErr("Mot de passe incorrect");setBusy(false);return;
    }
    if(identifier.includes("@")){
      const{error}=await supabase.auth.signInWithPassword({email:identifier.trim(),password:pwd});
      if(!error){onLogin("parent");return;}
    }
    setErr("Identifiant introuvable. Vérifiez votre nom ou email.");
    setBusy(false);
  };

  const doSignup=async()=>{
    const{prenom,nom,email,tel,pwd:p,pwd2}=sf;
    if(!prenom||!nom||!email||!p){setSErr("Tous les champs obligatoires sont requis");return;}
    if(p!==pwd2){setSErr("Les mots de passe ne correspondent pas");return;}
    if(p.length<6){setSErr("Mot de passe trop court (min. 6 caractères)");return;}
    setSBusy(true);setSErr("");
    const code=String(Math.floor(100000+Math.random()*900000));
    setVerfCode(code);setVerfExpiry(Date.now()+15*60*1000);setVerfInput("");setVerfErr("");
    await sendEmail(email,"✅ Vérifiez votre adresse email — Just Koul",emailHtmlVerif(prenom,code));
    setSBusy(false);
    setView("verify_signup");
  };
  const doVerifySignup=async()=>{
    if(verfInput!==verfCode){setVerfErr("Code incorrect. Vérifiez votre email.");return;}
    if(Date.now()>verfExpiry){setVerfErr("Code expiré. Veuillez recommencer.");return;}
    setVerfBusy(true);setVerfErr("");
    const{prenom,nom,email,tel,pwd:p}=sf;
    const{error}=await supabase.auth.signUp({email,password:p,options:{data:{prenom,nom,tel}}});
    setVerfBusy(false);
    if(error){setVerfErr(error.message);return;}
    setSOk(`Compte créé !\nVotre identifiant : ${nom.toLowerCase()}\nBienvenue chez Just Koul !`);
    sendWhatsApp(`🍱 *Just Koul — Nouvelle inscription*\n👤 ${prenom} ${nom}\n📱 ${tel||"Non renseigné"}\n📧 ${email}\n📅 ${todayStr()}\n→ Valider sur just-koul.vercel.app`);
    setView("signup");
  };

  const doForgot=async()=>{
    if(!fEmail.trim()){setFMsg("Entrez votre email");return;}
    setFBusy(true);
    const code=String(Math.floor(100000+Math.random()*900000));
    setVerfCode(code);setVerfExpiry(Date.now()+15*60*1000);setVerfInput("");setVerfErr("");
    await sendEmail(fEmail.trim(),"🔑 Réinitialisation de votre mot de passe — Just Koul",emailHtmlReset(code));
    setFBusy(false);setFMsg("");
    setView("verify_forgot");
  };
  const doVerifyForgot=async()=>{
    if(verfInput!==verfCode){setVerfErr("Code incorrect. Vérifiez votre email.");return;}
    if(Date.now()>verfExpiry){setVerfErr("Code expiré. Veuillez recommencer.");return;}
    setVerfBusy(true);setVerfErr("");
    const{error}=await supabase.auth.resetPasswordForEmail(fEmail.trim(),{redirectTo:"https://just-koul.vercel.app/reset-password"});
    setVerfBusy(false);
    if(error){setVerfErr(error.message);return;}
    setFMsg("Lien de réinitialisation envoyé ! Vérifiez votre boîte mail.");
    setView("forgot");
  };

  const goBack=()=>{setView("login");setErr("");setSErr("");setFMsg("");setSOk("");setVerfInput("");setVerfErr("");setVerfCode("");};
  const iS={width:"100%",padding:"12px 14px",fontFamily:F.sans,fontSize:14,background:C.white,color:C.text,border:`1.5px solid rgba(200,135,58,0.28)`,borderRadius:12,outline:"none",boxSizing:"border-box",marginBottom:12};
  const lS={fontFamily:F.sans,fontWeight:700,fontSize:11,color:C.green,display:"block",marginBottom:5,letterSpacing:0.3};

  return <AnimatePresence><motion.div key="ov" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
    style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(42,31,20,0.65)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}
    onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <motion.div initial={{opacity:0,scale:0.88,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.9}}
      transition={{duration:0.38,ease:[0.22,1,0.36,1]}}
      style={{background:C.cream,borderRadius:28,padding:"2.2rem",width:"100%",maxWidth:420,boxShadow:"0 24px 80px rgba(0,0,0,0.3)",fontFamily:F.sans,maxHeight:"90vh",overflowY:"auto"}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.5rem"}}>
        <div>
          {view!=="login"&&<button onClick={goBack} style={{background:"none",border:"none",cursor:"pointer",fontFamily:F.sans,fontSize:12,color:C.textL,marginBottom:4,padding:0,display:"block"}}>← Retour</button>}
          <h2 style={{fontFamily:F.serif,fontSize:22,color:C.green,margin:0}}>
            {view==="login"?"Connexion":view==="signup"?"Créer un compte":view==="verify_signup"?"Vérification email":view==="verify_forgot"?"Entrez le code":"Mot de passe oublié"}
          </h2>
          <p style={{fontSize:12,color:C.textL,margin:"4px 0 0"}}>
            {view==="login"?"Accédez à votre espace":view==="signup"?"Inscription parent":view==="verify_signup"||view==="verify_forgot"?"Vérification en deux étapes":"Réinitialisation"}
          </p>
        </div>
        <button onClick={onClose} style={{background:"rgba(44,74,30,0.08)",border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:16,color:C.green,flexShrink:0}}>✕</button>
      </div>

      {/* ── LOGIN VIEW ── */}
      {view==="login"&&<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
        <div style={{marginBottom:0}}>
          <label style={lS}>Identifiant <span style={{color:C.red}}>*</span></label>
          <input style={iS} type="text" value={identifier} onChange={e=>{setIdentifier(e.target.value);setErr("");}}
            placeholder="benali ou fatima@ex.com" onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
        </div>
        <div>
          <label style={lS}>Mot de passe <span style={{color:C.red}}>*</span></label>
          <input style={{...iS,marginBottom:16}} type="password" value={pwd} onChange={e=>{setPwd(e.target.value);setErr("");}}
            placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
        </div>
        {err&&<div style={{color:C.red,fontSize:12,marginBottom:12,padding:"8px 12px",background:"#FEF2F2",borderRadius:8}}>⚠ {err}</div>}
        <Btn onClick={doLogin} full disabled={busy}>{busy?"Connexion…":"Se connecter →"}</Btn>
        <button onClick={()=>setView("forgot")} style={{display:"block",width:"100%",background:"none",border:"none",cursor:"pointer",fontFamily:F.sans,fontSize:12,color:C.textL,marginTop:12,textAlign:"center",padding:4}}>
          Mot de passe oublié ?
        </button>
        <div style={{borderTop:`1px solid rgba(200,135,58,0.15)`,marginTop:14,paddingTop:14,textAlign:"center"}}>
          <span style={{fontSize:12,color:C.textL}}>Pas encore de compte ? </span>
          <button onClick={()=>setView("signup")} style={{background:"none",border:"none",cursor:"pointer",fontFamily:F.sans,fontSize:12,fontWeight:700,color:C.green,padding:0}}>
            Créer mon compte →
          </button>
        </div>
        <div style={{marginTop:14,padding:"10px 12px",background:"rgba(44,74,30,0.05)",borderRadius:12,fontSize:11,color:C.textL,lineHeight:1.6}}>
          <strong style={{color:C.green}}>Démo :</strong> benali / parent123 · admin / admin2026 · livreur / livreur2026
        </div>
      </motion.div>}

      {/* ── SIGNUP VIEW ── */}
      {view==="signup"&&<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
        {sOk?(
          <div style={{textAlign:"center",padding:"1rem 0"}}>
            <div style={{fontSize:48,marginBottom:12}}>✅</div>
            <div style={{fontFamily:F.serif,fontSize:16,color:C.green,marginBottom:16,whiteSpace:"pre-line",lineHeight:1.7}}>{sOk}</div>
            <Btn onClick={()=>{setSOk("");setView("login");}} full variant="outline">Retour à la connexion</Btn>
          </div>
        ):(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:0}}>
              <div>
                <label style={lS}>Prénom <span style={{color:C.red}}>*</span></label>
                <input style={{...iS}} type="text" value={sf.prenom} onChange={e=>setSf(f=>({...f,prenom:e.target.value}))} placeholder="Prénom"/>
              </div>
              <div>
                <label style={lS}>Nom <span style={{color:C.red}}>*</span></label>
                <input style={{...iS}} type="text" value={sf.nom} onChange={e=>setSf(f=>({...f,nom:e.target.value}))} placeholder="Nom"/>
              </div>
            </div>
            <label style={lS}>Email <span style={{color:C.red}}>*</span></label>
            <input style={iS} type="email" value={sf.email} onChange={e=>setSf(f=>({...f,email:e.target.value}))} placeholder="votre@email.com"/>
            <label style={lS}>Téléphone</label>
            <input style={iS} type="tel" value={sf.tel} onChange={e=>setSf(f=>({...f,tel:e.target.value}))} placeholder="06 XX XX XX XX"/>
            <label style={lS}>Mot de passe <span style={{color:C.red}}>*</span></label>
            <input style={iS} type="password" value={sf.pwd} onChange={e=>setSf(f=>({...f,pwd:e.target.value}))} placeholder="Min. 6 caractères"/>
            <label style={lS}>Confirmer le mot de passe</label>
            <input style={{...iS,marginBottom:16}} type="password" value={sf.pwd2} onChange={e=>setSf(f=>({...f,pwd2:e.target.value}))} placeholder="••••••••"/>
            {sErr&&<div style={{color:C.red,fontSize:12,marginBottom:12,padding:"8px 12px",background:"#FEF2F2",borderRadius:8}}>⚠ {sErr}</div>}
            <Btn onClick={doSignup} full disabled={sBusy}>{sBusy?"Création…":"Créer mon compte →"}</Btn>
          </>
        )}
      </motion.div>}

      {/* ── FORGOT VIEW ── */}
      {view==="forgot"&&<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
        <p style={{fontSize:13,color:C.textL,marginBottom:16,lineHeight:1.6}}>
          Entrez votre email pour recevoir un code de réinitialisation.
        </p>
        <label style={lS}>Email <span style={{color:C.red}}>*</span></label>
        <input style={{...iS,marginBottom:16}} type="email" value={fEmail} onChange={e=>setFEmail(e.target.value)} placeholder="votre@email.com" onKeyDown={e=>e.key==="Enter"&&!fMsg&&doForgot()}/>
        {fMsg&&<div style={{fontSize:12,marginBottom:12,padding:"8px 12px",background:fMsg.includes("Erreur")?"#FEF2F2":"#F0FDF4",borderRadius:8,color:fMsg.includes("Erreur")?C.red:"#16A34A"}}>{fMsg}</div>}
        <Btn onClick={doForgot} full disabled={fBusy||!!fMsg}>{fBusy?"Envoi…":"Envoyer le code →"}</Btn>
      </motion.div>}

      {/* ── VERIFY SIGNUP VIEW ── */}
      {view==="verify_signup"&&<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
        <p style={{fontSize:13,color:C.textL,marginBottom:16,lineHeight:1.6}}>
          Un code à 6 chiffres a été envoyé à <strong>{sf.email}</strong>. Entrez-le ci-dessous.
        </p>
        <label style={lS}>Code de vérification <span style={{color:C.red}}>*</span></label>
        <input style={{...iS,fontSize:24,letterSpacing:10,textAlign:"center",marginBottom:16}} type="text" maxLength={6}
          value={verfInput} onChange={e=>setVerfInput(e.target.value.replace(/\D/g,""))} placeholder="000000"
          onKeyDown={e=>e.key==="Enter"&&doVerifySignup()}/>
        {verfErr&&<div style={{color:C.red,fontSize:12,marginBottom:12,padding:"8px 12px",background:"#FEF2F2",borderRadius:8}}>⚠ {verfErr}</div>}
        <Btn onClick={doVerifySignup} full disabled={verfBusy||verfInput.length<6}>{verfBusy?"Vérification…":"Confirmer →"}</Btn>
        <button onClick={()=>setView("signup")} style={{display:"block",width:"100%",background:"none",border:"none",cursor:"pointer",fontFamily:F.sans,fontSize:12,color:C.textL,marginTop:12,textAlign:"center",padding:4}}>
          Changer d'email / Recommencer
        </button>
      </motion.div>}

      {/* ── VERIFY FORGOT VIEW ── */}
      {view==="verify_forgot"&&<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
        <p style={{fontSize:13,color:C.textL,marginBottom:16,lineHeight:1.6}}>
          Un code a été envoyé à <strong>{fEmail}</strong>. Entrez-le pour continuer.
        </p>
        <label style={lS}>Code de réinitialisation <span style={{color:C.red}}>*</span></label>
        <input style={{...iS,fontSize:24,letterSpacing:10,textAlign:"center",marginBottom:16}} type="text" maxLength={6}
          value={verfInput} onChange={e=>setVerfInput(e.target.value.replace(/\D/g,""))} placeholder="000000"
          onKeyDown={e=>e.key==="Enter"&&doVerifyForgot()}/>
        {verfErr&&<div style={{color:C.red,fontSize:12,marginBottom:12,padding:"8px 12px",background:"#FEF2F2",borderRadius:8}}>⚠ {verfErr}</div>}
        <Btn onClick={doVerifyForgot} full disabled={verfBusy||verfInput.length<6}>{verfBusy?"Vérification…":"Confirmer →"}</Btn>
        <button onClick={()=>{setView("forgot");setVerfInput("");setVerfErr("");}} style={{display:"block",width:"100%",background:"none",border:"none",cursor:"pointer",fontFamily:F.sans,fontSize:12,color:C.textL,marginTop:12,textAlign:"center",padding:4}}>
          ← Retour
        </button>
      </motion.div>}

    </motion.div>
  </motion.div></AnimatePresence>;
}

// ═══════════════════════════════════════
//   LOGO SVG COMPONENT
// ═══════════════════════════════════════
function JustKoulLogo({size=44,showText=true}){
  const [imgError,setImgError]=useState(false);
  if(imgError){
    return (
      <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
        <div style={{width:size,height:size,borderRadius:"50%",background:"rgba(44,74,30,0.1)",border:"2px solid #2C4A1E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.45}}>😊</div>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:size*0.38,color:"#2C4A1E",lineHeight:1}}>JUST</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:size*0.38,color:"#C8873A",lineHeight:1}}>KOUL</div>
          <div style={{fontFamily:"Nunito,sans-serif",fontWeight:600,fontSize:size*0.15,color:"#2C4A1E",opacity:0.6,letterSpacing:1,textTransform:"uppercase"}}>Eat · Enjoy · Repeat</div>
        </div>
      </div>
    );
  }
  return <img src="/images/logo-justkoul.png" alt="Just Koul" style={{height:size*1.8,width:"auto",objectFit:"contain"}} onError={()=>setImgError(true)}/>;
}

// ═══════════════════════════════════════
//   LEGAL MODALS + COOKIE BANNER
// ═══════════════════════════════════════
const LEGAL_CONTENT={
  mentions:{
    title:"Mentions Légales",
    body:`Éditeur du site : Just Koul
Activité : Traiteur scolaire et événementiel
Localisation : Agadir, Maroc
Téléphone : 06 33 95 87 60
Email : contact@just-koul.ma
Instagram : @just_koul / @just_koulbuffet

Hébergement : Vercel Inc.
440 N Barranca Ave #4133
Covina, CA 91723, États-Unis
https://vercel.com

Ce site a été développé en 2026.`,
  },
  cgv:{
    title:"Conditions Générales de Vente",
    sections:[
      {title:"1. SERVICES PROPOSÉS",text:`Just Koul propose deux types de services :\n· Cantine scolaire : livraison de repas du lundi au jeudi dans les écoles d'Agadir\n· Buffets événementiels : prestations traiteur sur mesure pour tout type d'événement`},
      {title:"2. TARIFS CANTINE",text:`· À la commande : 49 DH / 56 DH (complet)\n· Forfait semaine : 176 DH / 200 DH\n· Forfait mensuel : 688 DH / 770 DH\n· Forfait trimestriel : 1 950 DH / 2 200 DH\nRéductions fratrie : -10% (2 enfants), -20% (3), -30% (4 enfants et plus)`},
      {title:"3. INSCRIPTION ET COMMANDE",text:`L'inscription s'effectue via le formulaire en ligne ou par WhatsApp. Elle est confirmée après validation par l'équipe Just Koul et réception du paiement.`},
      {title:"4. PAIEMENT",text:`Modes acceptés : virement bancaire (Banque Populaire du Maroc, RIB : 101 810 0004800078601 34) ou espèces.\nAucun paiement par carte bancaire.\nLe paiement est dû avant le début de la période.`},
      {title:"5. LIVRAISON",text:`Les repas sont livrés entre 11h30 et 13h00, du lundi au jeudi. Pas de livraison les jours fériés et pendant les vacances scolaires.\nLa livraison est incluse pour les 6 écoles partenaires (Al Hanane, Amal School, Smart School, La Chrysalide, Al Inbihat, Académie Bel Air).\nSupplément de 30 DH pour toute autre école.`},
      {title:"6. ANNULATION",text:`· Forfait semaine : annulation possible avant le dimanche 20h précédant la semaine concernée.\n· Forfait mensuel/trimestriel : aucun remboursement après le début de la période.\nJust Koul se réserve le droit d'annuler une livraison en cas de force majeure.`},
      {title:"7. ALLERGIES ET RÉGIMES",text:`Le client est tenu de déclarer toute allergie ou restriction alimentaire lors de l'inscription. Just Koul décline toute responsabilité en cas d'allergie non déclarée.`},
      {title:"8. LITIGES",text:`En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux d'Agadir (Maroc) seront seuls compétents.\nDroit applicable : droit marocain.`},
    ],
  },
  rgpd:{
    title:"Politique de Confidentialité",
    sections:[
      {title:"",text:`Conformément à la loi n° 09-08 du Maroc relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel.`},
      {title:"1. RESPONSABLE DU TRAITEMENT",text:`Just Koul — Agadir, Maroc\nContact : 06 33 95 87 60`},
      {title:"2. DONNÉES COLLECTÉES",text:`· Nom et prénom du parent\n· Adresse email\n· Numéro de téléphone\n· Nom et classe de l'enfant (ou des enfants)\n· École fréquentée\n· Informations de paiement (méthode uniquement)\n· Allergies ou régimes alimentaires déclarés`},
      {title:"3. FINALITÉS DU TRAITEMENT",text:`Ces données sont collectées pour :\n· Gérer les inscriptions et abonnements cantine\n· Organiser les livraisons de repas\n· Établir les factures et suivre les paiements\n· Communiquer avec les familles inscrites`},
      {title:"4. DURÉE DE CONSERVATION",text:`Les données sont conservées pendant la durée de l'abonnement, puis 5 ans à des fins comptables, conformément à la législation marocaine.`},
      {title:"5. PARTAGE DES DONNÉES",text:`Just Koul ne vend ni ne partage vos données personnelles avec des tiers.\nLes données sont hébergées de manière sécurisée sur Supabase (serveurs en Union Européenne).`},
      {title:"6. VOS DROITS",text:`Conformément à la loi 09-08, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ces droits, contactez-nous par WhatsApp au 06 33 95 87 60.`},
      {title:"7. SÉCURITÉ",text:`Vos données sont protégées par des mesures de sécurité techniques (chiffrement SSL, authentification sécurisée via Supabase Auth).`},
      {title:"8. COOKIES",text:`Ce site utilise uniquement des cookies nécessaires au fonctionnement (session de connexion).\nAucun cookie publicitaire n'est utilisé.`},
    ],
  },
};

function LegalModal({type,onClose}){
  const content=LEGAL_CONTENT[type];
  if(!content)return null;
  return <AnimatePresence><motion.div key="legal-ov" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
    style={{position:"fixed",inset:0,zIndex:5000,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}
    onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <motion.div initial={{opacity:0,y:24,scale:0.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:16}}
      transition={{duration:0.3,ease:[0.22,1,0.36,1]}}
      style={{background:C.cream,borderRadius:22,width:"100%",maxWidth:640,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.35)",fontFamily:F.sans}}>
      <div style={{position:"sticky",top:0,background:C.cream,borderBottom:`1px solid rgba(200,135,58,0.15)`,padding:"1.2rem 1.5rem",display:"flex",justifyContent:"space-between",alignItems:"center",zIndex:1}}>
        <h2 style={{fontFamily:F.serif,fontSize:20,color:C.green,margin:0}}>{content.title}</h2>
        <button onClick={onClose} style={{background:"rgba(44,74,30,0.08)",border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:16,color:C.green}}>✕</button>
      </div>
      <div style={{padding:"1.4rem 1.5rem 2rem"}}>
        {content.body&&<p style={{fontSize:13,color:C.text,lineHeight:1.9,whiteSpace:"pre-line"}}>{content.body}</p>}
        {content.sections&&content.sections.map((s,i)=><div key={i} style={{marginBottom:16}}>
          {s.title&&<div style={{fontFamily:F.sans,fontWeight:800,fontSize:12,color:C.green,letterSpacing:0.5,marginBottom:6,textTransform:"uppercase"}}>{s.title}</div>}
          <p style={{fontSize:13,color:C.text,lineHeight:1.9,margin:0,whiteSpace:"pre-line"}}>{s.text}</p>
        </div>)}
      </div>
    </motion.div>
  </motion.div></AnimatePresence>;
}

function CookieBanner(){
  const [visible,setVisible]=useState(()=>!localStorage.getItem('jk_cookies_accepted'));
  const accept=()=>{localStorage.setItem('jk_cookies_accepted','1');setVisible(false);};
  const decline=()=>{localStorage.setItem('jk_cookies_accepted','0');setVisible(false);};
  if(!visible)return null;
  return <AnimatePresence><motion.div initial={{y:100,opacity:0}} animate={{y:0,opacity:1}} exit={{y:100,opacity:0}}
    transition={{duration:0.35,ease:[0.22,1,0.36,1]}}
    style={{position:"fixed",bottom:0,left:0,right:0,zIndex:9999,background:"rgba(17,26,10,0.97)",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,fontFamily:F.sans}}>
    <span style={{fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.5,flex:1,minWidth:240}}>
      🍪 Ce site utilise des cookies essentiels pour votre connexion et navigation. Aucun cookie publicitaire.
    </span>
    <div style={{display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
      <button onClick={accept} style={{background:C.green,color:C.white,border:"none",borderRadius:20,padding:"8px 20px",fontFamily:F.sans,fontWeight:700,fontSize:13,cursor:"pointer"}}>✓ Accepter</button>
      <button onClick={decline} style={{background:"none",color:"rgba(255,255,255,0.55)",border:"none",fontFamily:F.sans,fontSize:12,cursor:"pointer",padding:"4px 8px",textDecoration:"underline"}}>Continuer sans accepter</button>
    </div>
  </motion.div></AnimatePresence>;
}

// ═══════════════════════════════════════
//   PUBLIC SITE
const BUFFET_CARDS=[
  {title:"Mariages & Fiançailles",desc:"Buffets élégants pour célébrer vos plus beaux moments.",img:"https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80&auto=format&fit=crop",icon:"💍",fallback:"linear-gradient(135deg,#8B5CF6,#6D28D9)"},
  {title:"Événements Corporate",desc:"Repas professionnels pour séminaires et lancements.",img:"https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&q=80&auto=format&fit=crop",icon:"🏢",fallback:"linear-gradient(135deg,#2563EB,#1D4ED8)"},
  {title:"Anniversaires & Fêtes",desc:"Tables gourmandes pour tous vos moments de célébration.",img:"https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&q=80&auto=format&fit=crop",icon:"🎂",fallback:"linear-gradient(135deg,#EC4899,#BE185D)"},
  {title:"Ftour Ramadan",desc:"Buffets généreux pour vos Iftars en famille ou entre amis.",img:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80&auto=format&fit=crop",icon:"🌙",fallback:"linear-gradient(135deg,#D97706,#B45309)"},
  {title:"Ventes Privées",desc:"Finger food et tables garnies pour vos événements exclusifs.",img:"https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80&auto=format&fit=crop",icon:"✨",fallback:"linear-gradient(135deg,#0D9488,#0F766E)"},
  {title:"Cocktails Dînatoires",desc:"Service élégant et saveurs raffinées sur mesure.",img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&auto=format&fit=crop",icon:"🥂",fallback:"linear-gradient(135deg,#C8873A,#92400E)"},
];

// ═══════════════════════════════════════
function PublicSite({onLoginClick,data,setData}){
  const [scrolled,setScrolled]=useState(false);
  const [mobileMenu,setMobileMenu]=useState(false);
  const [activeSection,setActiveSection]=useState("accueil");
  const [selDay,setSelDay]=useState(0);
  const [formContact,setFormContact]=useState({prenom:"",nom:"",tel:"",email:"",school:"al-hanane",autreEcole:"",nbEnfants:1,formule:"mensuel",repasType:"pe",days:{lundi:false,mardi:false,mercredi:false,jeudi:false},typeEvent:"",dateEvent:"",nbPersonnes:"",message:""});
  const [submitted,setSubmitted]=useState(false);
  const [hoveredCat,setHoveredCat]=useState(null);
  const [legalModal,setLegalModal]=useState(null);
  useEffect(()=>{const fn=()=>setScrolled(window.scrollY>50);window.addEventListener("scroll",fn);return()=>window.removeEventListener("scroll",fn);},[]);
  useEffect(()=>{const ids=["accueil","comment-ca-marche","cantine","engagements","buffets","avis","galerie","devis","contact"];const obs=new IntersectionObserver(en=>{en.forEach(e=>{if(e.isIntersecting)setActiveSection(e.target.id);});},{threshold:0.3});ids.forEach(id=>{const el=document.getElementById(id);if(el)obs.observe(el);});return()=>obs.disconnect();},[]);
  const scrollTo=id=>{setMobileMenu(false);document.getElementById(id)?.scrollIntoView({behavior:"smooth"});};
  const hf=(k,v)=>setFormContact(f=>({...f,[k]:v}));
  const approvedReviews=data.reviews.filter(r=>r.status==="approved");
  const navLinks=[{id:"accueil",label:"Accueil"},{id:"cantine",label:"Cantine scolaire"},{id:"buffets",label:"Buffets"},{id:"galerie",label:"Galerie"},{id:"devis",label:"Devis événement"},{id:"contact",label:"Contact"}];
  const CATEGORIES=[
    {id:"cantine",icon:"🏫",label:"Cantine scolaire",desc:"Lundi – Jeudi",color:"#F0F9F0",border:"#2C4A1E",iconBg:"#2C4A1E"},
    {id:"comment-ca-marche",icon:"📝",label:"Comment ça marche",desc:"3 étapes simples",color:"#F0F4FF",border:"#2563EB",iconBg:"#2563EB"},
    {id:"buffets",icon:"🎂",label:"Anniversaires",desc:"Livraison à domicile",color:"#FFF0F5",border:"#C0392B",iconBg:"#C0392B"},
    {id:"buffets",icon:"🏢",label:"Corporate",desc:"Séminaires & déjeuners",color:"#F0F4FF",border:"#2563EB",iconBg:"#2563EB"},
    {id:"buffets",icon:"🎊",label:"Buffets & Mariages",desc:"Sur mesure",color:"#FFF8EE",border:"#C8873A",iconBg:"#C8873A"},
  ];

  return (
    <><div style={{fontFamily:F.sans,background:C.white}}>

      {/* ── NAV ── */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:scrolled?"rgba(255,255,255,0.97)":"rgba(255,255,255,0.8)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${scrolled?"rgba(0,0,0,0.08)":"transparent"}`,transition:"all 0.3s",padding:"0 2rem"}}>
        <div style={{maxWidth:1280,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:70}}>
          {/* Logo */}
          <div onClick={()=>scrollTo("accueil")} style={{cursor:"pointer"}}>
            <JustKoulLogo size={38} showText={false}/>
          </div>
          {/* Center links */}
          <div style={{display:"flex",gap:"2rem",alignItems:"center"}} className="nd">
            {navLinks.map(l=>(
              <button key={l.id} onClick={()=>scrollTo(l.id)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:F.sans,fontSize:13,fontWeight:700,color:activeSection===l.id?C.green:C.textL,position:"relative",padding:"4px 0",transition:"color 0.2s"}}>
                {l.label}
                {activeSection===l.id&&<motion.div layoutId="navunderline" style={{position:"absolute",bottom:-2,left:0,right:0,height:2,background:C.gold,borderRadius:2}}/>}
              </button>
            ))}
          </div>
          {/* Right CTA */}
          <div style={{display:"flex",gap:10,alignItems:"center"}} className="nd">
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 14px",background:"rgba(44,74,30,0.06)",borderRadius:20,border:`1px solid rgba(44,74,30,0.12)`}}>
              <span style={{fontSize:13}}>📍</span><span style={{fontFamily:F.sans,fontSize:12,fontWeight:700,color:C.green}}>Agadir</span>
            </div>
            <motion.button onClick={onLoginClick} whileHover={{scale:1.04}} whileTap={{scale:0.96}}
              style={{background:C.green,color:C.white,border:"none",borderRadius:24,padding:"10px 22px",fontFamily:F.sans,fontWeight:800,fontSize:13,cursor:"pointer",letterSpacing:0.3,boxShadow:`0 4px 18px rgba(44,74,30,0.3)`}}>
              Mon espace →
            </motion.button>
          </div>
          <button onClick={()=>setMobileMenu(m=>!m)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:C.green,display:"none"}} className="nm">{mobileMenu?"✕":"☰"}</button>
        </div>
        {mobileMenu&&(
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} style={{background:C.white,borderTop:`1px solid rgba(0,0,0,0.06)`,padding:"1rem 2rem",display:"flex",flexDirection:"column",gap:6}}>
            {navLinks.map(l=><button key={l.id} onClick={()=>scrollTo(l.id)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:F.sans,fontSize:14,fontWeight:700,color:C.green,textAlign:"left",padding:"10px 0",borderBottom:`1px solid rgba(0,0,0,0.06)`}}>{l.label}</button>)}
            <button onClick={()=>{setMobileMenu(false);onLoginClick();}} style={{background:C.green,color:C.white,border:"none",borderRadius:14,padding:"12px",fontFamily:F.sans,fontWeight:800,fontSize:14,cursor:"pointer",marginTop:8}}>Mon espace →</button>
          </motion.div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section id="accueil" style={{minHeight:"100vh",background:C.white,display:"flex",alignItems:"center",padding:"70px 2rem 0",position:"relative",overflow:"hidden"}}>
        {/* Blobs décoratifs */}
        <div style={{position:"absolute",top:-80,right:-80,width:520,height:520,borderRadius:"50%",background:"rgba(44,74,30,0.04)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-60,right:180,width:300,height:300,borderRadius:"50%",background:"rgba(200,135,58,0.05)",pointerEvents:"none"}}/>

        <div className="hero-grid" style={{maxWidth:1280,margin:"0 auto",width:"100%",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3rem",alignItems:"center",minHeight:"calc(100vh - 70px)"}}>

          {/* LEFT */}
          <motion.div variants={stagger} initial="hidden" animate="show" style={{paddingBottom:"3rem"}}>
            {/* Location badge */}
            <motion.div variants={fadeUp} style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(44,74,30,0.07)",borderRadius:30,padding:"7px 16px",marginBottom:28}}>
              <span style={{fontSize:14}}>📍</span>
              <span style={{fontFamily:F.sans,fontWeight:700,fontSize:12,color:C.green,letterSpacing:0.5}}>Agadir, Maroc</span>
              <span style={{width:4,height:4,borderRadius:"50%",background:C.green,opacity:0.3}}/>
              <span style={{fontFamily:F.sans,fontSize:11,color:C.textL}}>Livraison écoles & domicile</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} style={{fontFamily:F.serif,fontSize:"clamp(2.4rem,4.5vw,3.6rem)",fontWeight:800,color:"#1A1A1A",lineHeight:1.1,marginBottom:20}}>
              Des repas faits<br/>
              <span style={{color:C.green}}>avec amour</span>,<br/>
              livrés avec soin
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={fadeUp} style={{fontFamily:F.sans,fontSize:15,color:"#666",lineHeight:1.75,marginBottom:32,maxWidth:440}}>
              Just Koul, c'est la cantine scolaire réinventée pour Agadir — lunch boxes fraîches et équilibrées livrées directement à l'école, et des buffets événementiels sur mesure.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeUp} className="hero-ctas" style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:40}}>
              <motion.button onClick={onLoginClick} whileHover={{scale:1.04,boxShadow:`0 8px 28px rgba(44,74,30,0.35)`}} whileTap={{scale:0.97}}
                style={{background:C.green,color:C.white,border:"none",borderRadius:30,padding:"14px 30px",fontFamily:F.sans,fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:`0 4px 18px rgba(44,74,30,0.25)`,letterSpacing:0.3}}>
                👨‍👩‍👧‍👦 Inscrire mon enfant
              </motion.button>
              <motion.button onClick={()=>scrollTo("devis")} whileHover={{scale:1.04}} whileTap={{scale:0.97}}
                style={{background:C.white,color:C.green,border:`2px solid ${C.green}`,borderRadius:30,padding:"14px 30px",fontFamily:F.sans,fontWeight:800,fontSize:14,cursor:"pointer",letterSpacing:0.3}}>
                🎊 Demander un devis
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} className="hero-stats" style={{display:"flex",gap:32,flexWrap:"wrap"}}>
              {[["100+","Familles servies"],["6","Écoles partenaires"],["0%","Conservateurs"],["★ 4.9","Avis clients"]].map(([val,lab])=>(
                <div key={lab}>
                  <div style={{fontFamily:F.serif,fontWeight:800,fontSize:22,color:C.green,lineHeight:1}}>{val}</div>
                  <div style={{fontFamily:F.sans,fontSize:11,color:"#999",marginTop:2,fontWeight:600}}>{lab}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* RIGHT — Photo hero */}
          <motion.div
            initial={{opacity:0,x:40}}
            animate={{opacity:1,x:0}}
            transition={{duration:0.9,delay:0.2}}
            className="hero-img-wrap"
            style={{position:"relative",display:"flex",justifyContent:"center",
                    alignItems:"center",paddingBottom:"3rem",minHeight:520}}>

            {/* Photo principale */}
            <motion.div
              animate={{y:[0,-10,0]}}
              transition={{duration:5,repeat:Infinity,ease:"easeInOut"}}
              style={{position:"relative",zIndex:2}}>
              <div className="hero-img-box" style={{width:420,height:420,borderRadius:32,overflow:"hidden",
                           boxShadow:"0 32px 80px rgba(0,0,0,0.2)",position:"relative"}}>
                <img
                  src="/images/hero-plat.jpg"
                  alt="Plat Just Koul"
                  style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                />
                {/* Overlay bas avec badges */}
                <div style={{position:"absolute",bottom:0,left:0,right:0,
                             background:"linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 100%)",
                             padding:"20px 16px",display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{background:"#C8873A",borderRadius:20,padding:"6px 14px",
                               fontFamily:F.serif,fontWeight:700,fontSize:13,color:"white"}}>
                    dès 49 DH
                  </div>
                  <div style={{background:"rgba(255,255,255,0.9)",borderRadius:20,
                               padding:"6px 14px",fontFamily:F.sans,fontWeight:700,
                               fontSize:11,color:"#2C4A1E"}}>
                    🌿 100% fait maison
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Carte livraison en haut à gauche */}
            <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}}
              transition={{delay:0.7}}
              className="hero-float"
              style={{position:"absolute",top:"8%",left:"-5%",background:"white",
                      borderRadius:18,padding:"12px 16px",
                      boxShadow:"0 12px 40px rgba(0,0,0,0.12)",
                      display:"flex",alignItems:"center",gap:10,zIndex:4,
                      border:"1px solid rgba(0,0,0,0.06)"}}>
              <div style={{width:36,height:36,borderRadius:10,background:"#F0F9F0",
                           display:"flex",alignItems:"center",justifyContent:"center",
                           fontSize:18}}>✅</div>
              <div>
                <div style={{fontWeight:800,fontSize:12,color:"#1A1A1A"}}>
                  Livraison confirmée
                </div>
                <div style={{fontSize:10,color:"#999",marginTop:1}}>
                  Youssef Benali · 12:15
                </div>
              </div>
            </motion.div>

            {/* Carte menu en bas à droite */}
            <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}}
              transition={{delay:0.9}}
              className="hero-float"
              style={{position:"absolute",bottom:"10%",right:"-5%",background:"white",
                      borderRadius:18,padding:"14px 16px",
                      boxShadow:"0 12px 40px rgba(0,0,0,0.12)",
                      zIndex:4,border:"1px solid rgba(0,0,0,0.06)",maxWidth:200}}>
              <div style={{fontSize:11,fontWeight:700,color:"#C8873A",marginBottom:4}}>
                ⭐ Menu du jour
              </div>
              <div style={{fontFamily:F.serif,fontWeight:700,fontSize:14,
                           color:"#2C4A1E",lineHeight:1.3}}>
                Poulet rôti & riz pilaf
              </div>
              <div style={{fontSize:11,color:"#6B5240",marginTop:3}}>
                + Salade + Yaourt maison
              </div>
            </motion.div>

            {/* Bubble rating */}
            <motion.div animate={{scale:[1,1.08,1]}}
              transition={{duration:2.5,repeat:Infinity}}
              className="hero-float"
              style={{position:"absolute",top:"50%",left:"-8%",
                      background:"linear-gradient(135deg,#C8873A,#E8A555)",
                      borderRadius:"50%",width:68,height:68,
                      display:"flex",flexDirection:"column",
                      alignItems:"center",justifyContent:"center",
                      boxShadow:"0 8px 24px rgba(200,135,58,0.4)",zIndex:4}}>
              <div style={{fontFamily:F.serif,fontWeight:800,fontSize:14,
                           color:"white",lineHeight:1}}>★ 4.9</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.85)",marginTop:1}}>
                avis
              </div>
            </motion.div>

          </motion.div>
        </div>

        {/* ── CATÉGORIES STRIP ── */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,background:C.white,borderTop:`1px solid rgba(0,0,0,0.06)`,boxShadow:"0 -4px 24px rgba(0,0,0,0.04)"}}>
          <div style={{maxWidth:1280,margin:"0 auto",padding:"0 2rem",display:"flex",gap:0,overflowX:"auto"}}>
            {CATEGORIES.map((cat,i)=>(
              <motion.button key={i} onClick={()=>scrollTo(cat.id)} onHoverStart={()=>setHoveredCat(i)} onHoverEnd={()=>setHoveredCat(null)}
                whileHover={{y:-3}} whileTap={{scale:0.97}}
                style={{flex:"0 0 auto",display:"flex",alignItems:"center",gap:12,padding:"18px 28px",background:"transparent",border:"none",borderRight:`1px solid rgba(0,0,0,0.06)`,cursor:"pointer",position:"relative",overflow:"hidden",transition:"background 0.2s",borderBottom:hoveredCat===i?`3px solid ${cat.border}`:"3px solid transparent"}}>
                <div style={{width:40,height:40,borderRadius:12,background:cat.iconBg+"14",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{cat.icon}</div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontFamily:F.sans,fontWeight:800,fontSize:13,color:"#1A1A1A",whiteSpace:"nowrap"}}>{cat.label}</div>
                  <div style={{fontFamily:F.sans,fontSize:11,color:"#999",marginTop:1}}>{cat.desc}</div>
                </div>
                <span style={{color:"#CCC",fontSize:14,marginLeft:6}}>→</span>
              </motion.button>
            ))}
            {/* Connexion */}
            <motion.button onClick={onLoginClick} whileHover={{y:-3}} style={{flex:"0 0 auto",display:"flex",alignItems:"center",gap:12,padding:"18px 28px",background:"transparent",border:"none",cursor:"pointer",borderBottom:"3px solid transparent"}}>
              <div style={{width:40,height:40,borderRadius:12,background:"rgba(44,74,30,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🔐</div>
              <div style={{textAlign:"left"}}>
                <div style={{fontFamily:F.sans,fontWeight:800,fontSize:13,color:C.green,whiteSpace:"nowrap"}}>Mon espace</div>
                <div style={{fontFamily:F.sans,fontSize:11,color:"#999",marginTop:1}}>Parents · Admin · Livreur</div>
              </div>
            </motion.button>
          </div>
        </div>
        <style>{`@media(max-width:768px){.nd{display:none!important;}.nm{display:block!important;}}`}</style>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section id="comment-ca-marche" style={{background:"#FFFFFF",padding:"80px 2rem"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={VP} style={{textAlign:"center",marginBottom:"3.5rem"}}>
            <motion.div variants={fadeUp} style={{fontFamily:F.sans,fontSize:11,fontWeight:800,letterSpacing:3,textTransform:"uppercase",color:C.gold,marginBottom:10}}>🚀 Simple & rapide</motion.div>
            <motion.h2 variants={fadeUp} style={{fontFamily:F.serif,fontSize:"clamp(2rem,4vw,3rem)",color:C.green,margin:0}}>Comment ça marche ?</motion.h2>
            <motion.p variants={fadeUp} style={{fontFamily:F.sans,fontSize:15,color:C.textL,maxWidth:480,margin:"1rem auto 0",lineHeight:1.7}}>Simple comme bonjour — en 3 étapes</motion.p>
          </motion.div>
          <motion.div variants={staggerFast} initial="hidden" whileInView="show" viewport={VP}
            className="steps-grid" style={{display:"grid",gridTemplateColumns:"1fr auto 1fr auto 1fr",gap:0,alignItems:"center"}}>
            {/* Étape 1 */}
            <motion.div variants={fadeUp} style={{textAlign:"center",padding:"0 1.5rem"}}>
              <div style={{width:80,height:80,borderRadius:"50%",background:C.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 1.2rem",boxShadow:`0 8px 24px rgba(44,74,30,0.3)`}}>📝</div>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(44,74,30,0.07)",borderRadius:20,padding:"4px 12px",marginBottom:10}}>
                <span style={{fontFamily:F.sans,fontWeight:800,fontSize:10,color:C.green,letterSpacing:1,textTransform:"uppercase"}}>Étape 1</span>
              </div>
              <h3 style={{fontFamily:F.serif,fontWeight:700,fontSize:19,color:C.green,margin:"0 0 10px"}}>Inscrivez-vous</h3>
              <p style={{fontFamily:F.sans,fontSize:13,color:C.textL,lineHeight:1.75,margin:0}}>Inscrivez-vous en ligne en 2 minutes. Choisissez votre formule, vos jours et l'école de votre enfant.</p>
            </motion.div>
            {/* Flèche 1 */}
            <div className="nd" style={{fontSize:28,color:"rgba(200,135,58,0.5)",flexShrink:0,userSelect:"none"}}>→</div>
            {/* Étape 2 */}
            <motion.div variants={fadeUp} style={{textAlign:"center",padding:"0 1.5rem"}}>
              <div style={{width:80,height:80,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 1.2rem",boxShadow:`0 8px 24px rgba(200,135,58,0.35)`}}>👩‍🍳</div>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(200,135,58,0.1)",borderRadius:20,padding:"4px 12px",marginBottom:10}}>
                <span style={{fontFamily:F.sans,fontWeight:800,fontSize:10,color:C.gold,letterSpacing:1,textTransform:"uppercase"}}>Étape 2</span>
              </div>
              <h3 style={{fontFamily:F.serif,fontWeight:700,fontSize:19,color:C.green,margin:"0 0 10px"}}>On cuisine</h3>
              <p style={{fontFamily:F.sans,fontSize:13,color:C.textL,lineHeight:1.75,margin:0}}>Notre équipe prépare chaque matin des repas frais et équilibrés avec des produits locaux d'Agadir.</p>
            </motion.div>
            {/* Flèche 2 */}
            <div className="nd" style={{fontSize:28,color:"rgba(200,135,58,0.5)",flexShrink:0,userSelect:"none"}}>→</div>
            {/* Étape 3 */}
            <motion.div variants={fadeUp} style={{textAlign:"center",padding:"0 1.5rem"}}>
              <div style={{width:80,height:80,borderRadius:"50%",background:C.greenL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 1.2rem",boxShadow:`0 8px 24px rgba(61,107,44,0.3)`}}>🛵</div>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(61,107,44,0.07)",borderRadius:20,padding:"4px 12px",marginBottom:10}}>
                <span style={{fontFamily:F.sans,fontWeight:800,fontSize:10,color:C.greenL,letterSpacing:1,textTransform:"uppercase"}}>Étape 3</span>
              </div>
              <h3 style={{fontFamily:F.serif,fontWeight:700,fontSize:19,color:C.green,margin:"0 0 10px"}}>On livre</h3>
              <p style={{fontFamily:F.sans,fontSize:13,color:C.textL,lineHeight:1.75,margin:0}}>Votre enfant reçoit son repas chaud entre 11h30 et 13h, directement à son école.</p>
            </motion.div>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VP} style={{textAlign:"center",marginTop:"3rem"}}>
            <motion.button onClick={onLoginClick} whileHover={{scale:1.04,boxShadow:`0 10px 32px rgba(44,74,30,0.35)`}} whileTap={{scale:0.97}}
              style={{background:C.green,color:C.white,border:"none",borderRadius:30,padding:"15px 36px",fontFamily:F.sans,fontWeight:800,fontSize:15,cursor:"pointer",boxShadow:`0 6px 22px rgba(44,74,30,0.28)`,letterSpacing:0.3}}>
              👨‍👩‍👧‍👦 Inscrire mon enfant →
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* CANTINE */}
      <section id="cantine" style={{background:C.lcream,padding:"80px 2rem"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={VP} style={{textAlign:"center",marginBottom:"3rem"}}>
            <motion.div variants={fadeUp} style={{fontFamily:F.sans,fontSize:11,fontWeight:800,letterSpacing:3,textTransform:"uppercase",color:C.gold,marginBottom:10}}>🏫 Pour vos enfants</motion.div>
            <motion.h2 variants={fadeUp} style={{fontFamily:F.serif,fontSize:"clamp(2rem,4vw,3rem)",color:C.green,margin:0}}>La Cantine Scolaire</motion.h2>
            <motion.p variants={fadeUp} style={{fontFamily:F.sans,fontSize:15,color:C.textL,maxWidth:540,margin:"1rem auto 0",lineHeight:1.7}}>Du lundi au jeudi, des repas frais, équilibrés et savoureux livrés directement à l'école. <strong>Pain, sauces, jus — tout est préparé avec amour.</strong></motion.p>
          </motion.div>
          <motion.div variants={staggerFast} initial="hidden" whileInView="show" viewport={VP} style={{display:"flex",justifyContent:"center",gap:10,marginBottom:"2rem",flexWrap:"wrap"}}>
            {MENU_SEMAINE.map((m,i)=><motion.button key={i} variants={fadeUp} onClick={()=>setSelDay(i)} whileHover={{y:-2}} whileTap={{scale:0.95}}
              style={{background:selDay===i?C.green:C.white,color:selDay===i?C.white:C.green,border:`2px solid ${C.green}`,borderRadius:20,padding:"8px 20px",fontFamily:F.sans,fontWeight:700,fontSize:13,cursor:"pointer",transition:"all 0.2s"}}>
              {m.emoji} {m.jour}
            </motion.button>)}
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.div key={selDay} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.3}}>
              <Card style={{maxWidth:640,margin:"0 auto 3rem",boxShadow:`0 8px 30px rgba(44,74,30,0.1)`}}>
                <div style={{textAlign:"center",marginBottom:"1rem"}}>
                  <motion.div initial={{scale:0.5}} animate={{scale:1}} transition={{type:"spring",stiffness:260,damping:20}} style={{fontSize:42}}>{MENU_SEMAINE[selDay].emoji}</motion.div>
                  <h3 style={{fontFamily:F.serif,fontSize:20,color:C.green,margin:"8px 0 4px"}}>Menu du {MENU_SEMAINE[selDay].jour}</h3>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
                  {[["Entrée","🥗",MENU_SEMAINE[selDay].entree,"#F0FAF0"],["Plat principal","🍽️",MENU_SEMAINE[selDay].plat,"#FFF8EC"],["Dessert","🍮",MENU_SEMAINE[selDay].dessert,"#FFF0F0"]].map(([label,ic,val,bg])=>(
                    <div key={label} style={{background:bg,borderRadius:12,padding:"0.9rem",textAlign:"center"}}>
                      <div style={{fontSize:24,marginBottom:4}}>{ic}</div>
                      <div style={{fontFamily:F.sans,fontSize:9,fontWeight:800,color:C.gold,letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{label}</div>
                      <div style={{fontFamily:F.sans,fontSize:12,fontWeight:600,color:C.text}}>{val}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
          <h3 style={{textAlign:"center",fontFamily:F.serif,fontSize:22,color:C.green,marginBottom:"1.5rem"}}>Formules & Tarifs</h3>
          <motion.div variants={staggerFast} initial="hidden" whileInView="show" viewport={VP} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
            {TARIFS_PUBLIC.map(t=><motion.div key={t.label} variants={fadeUp} whileHover={!t.popular?{y:-5}:{}}
              style={{background:t.popular?C.green:C.white,borderRadius:20,padding:"1.4rem",border:`2px solid ${t.popular?C.green:"rgba(200,135,58,0.2)"}`,boxShadow:t.popular?`0 16px 40px rgba(44,74,30,0.25)`:`0 4px 14px rgba(0,0,0,0.05)`,position:"relative",transform:t.popular?"scale(1.03)":"scale(1)"}}>
              {t.popular&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:C.gold,color:C.white,borderRadius:20,padding:"3px 14px",fontFamily:F.sans,fontSize:10,fontWeight:800,letterSpacing:1,textTransform:"uppercase",whiteSpace:"nowrap"}}>⭐ Le plus choisi</div>}
              <div style={{fontSize:30,marginBottom:6,textAlign:"center"}}>{t.icon}</div>
              <div style={{fontFamily:F.serif,fontWeight:700,fontSize:16,textAlign:"center",marginBottom:4,color:t.popular?C.white:C.green}}>{t.label}</div>
              {t.options.map((o,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<t.options.length-1?`1px solid ${t.popular?"rgba(255,255,255,0.15)":"rgba(200,135,58,0.15)"}`:""}}><span style={{fontFamily:F.sans,fontSize:11,color:t.popular?"rgba(255,255,255,0.8)":C.textL,flex:1}}>{o.desc}</span><span style={{fontFamily:F.serif,fontWeight:700,fontSize:15,color:t.popular?C.goldL:C.gold,whiteSpace:"nowrap",marginLeft:8}}>{o.prix}</span></div>)}
            </motion.div>)}
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VP} style={{textAlign:"center",marginTop:"2.5rem"}}>
            <motion.button onClick={onLoginClick} whileHover={{scale:1.04,boxShadow:`0 8px 28px rgba(44,74,30,0.35)`}} whileTap={{scale:0.97}}
              style={{background:C.green,color:C.white,border:"none",borderRadius:30,padding:"14px 32px",fontFamily:F.sans,fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:`0 4px 18px rgba(44,74,30,0.25)`,letterSpacing:0.3}}>
              👨‍👩‍👧‍👦 Accéder à mon espace parent →
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ── NOS ENGAGEMENTS ── */}
      <section id="engagements" style={{background:"linear-gradient(135deg,#2C4A1E,#3D6B2C)",padding:"80px 2rem"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={VP} style={{textAlign:"center",marginBottom:"3rem"}}>
            <motion.div variants={fadeUp} style={{fontFamily:F.sans,fontSize:11,fontWeight:800,letterSpacing:3,textTransform:"uppercase",color:"rgba(232,165,85,0.9)",marginBottom:10}}>💚 Notre promesse</motion.div>
            <motion.h2 variants={fadeUp} style={{fontFamily:F.serif,fontSize:"clamp(2rem,4vw,3rem)",color:"#FFFFFF",margin:0}}>Nos engagements</motion.h2>
            <motion.p variants={fadeUp} style={{fontFamily:F.sans,fontSize:15,color:"rgba(255,255,255,0.75)",maxWidth:480,margin:"1rem auto 0",lineHeight:1.7}}>La qualité Just Koul, chaque jour</motion.p>
          </motion.div>
          <motion.div variants={staggerFast} initial="hidden" whileInView="show" viewport={VP}
            className="engagements-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
            {[
              {icon:"🌿",title:"100% Fait maison",text:"Chaque plat préparé le matin même dans notre cuisine à Agadir"},
              {icon:"🥩",title:"Produits frais locaux",text:"Nous sourçons nos ingrédients chez les producteurs locaux de la région Souss-Massa"},
              {icon:"✅",title:"100% Halal",text:"Tous nos plats respectent les normes halal. Aucun compromis sur la qualité"},
              {icon:"🚚",title:"Livraison incluse",text:"La livraison est incluse dans tous nos forfaits pour les 6 écoles partenaires"},
              {icon:"👨‍👩‍👧",title:"Réductions fratrie",text:"Jusqu'à -30% pour les familles nombreuses. Plus d'enfants = plus d'économies"},
              {icon:"📱",title:"Suivi en temps réel",text:"Recevez une notification WhatsApp à chaque livraison confirmée"},
            ].map(e=>(
              <motion.div key={e.title} variants={fadeUp} whileHover={{background:"rgba(255,255,255,0.15)"}}
                style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:18,padding:"1.4rem",transition:"background 0.2s"}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,marginBottom:12}}>
                  {e.icon}
                </div>
                <div style={{fontFamily:F.serif,fontWeight:700,fontSize:15,color:"#FFFFFF",marginBottom:8}}>{e.title}</div>
                <div style={{fontFamily:F.sans,fontSize:12,color:"rgba(255,255,255,0.75)",lineHeight:1.7}}>{e.text}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* BUFFETS */}
      <section id="buffets" style={{background:C.white,padding:"80px 2rem"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={VP} style={{textAlign:"center",marginBottom:"3rem"}}>
            <motion.div variants={fadeUp} style={{fontFamily:F.sans,fontSize:11,fontWeight:800,letterSpacing:3,textTransform:"uppercase",color:C.gold,marginBottom:10}}>🎊 Sur mesure</motion.div>
            <motion.h2 variants={fadeUp} style={{fontFamily:F.serif,fontSize:"clamp(2rem,4vw,3rem)",color:C.green,margin:0}}>Buffets & Événements</motion.h2>
          </motion.div>
          <motion.div variants={staggerFast} initial="hidden" whileInView="show" viewport={VP} className="buffet-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:"3rem"}}>
            {BUFFET_CARDS.map(p=>(
              <motion.div key={p.title} variants={fadeUp}
                whileHover={{scale:1.03,boxShadow:"0 24px 56px rgba(0,0,0,0.22)"}}
                transition={{duration:0.3,ease:[0.22,1,0.36,1]}}
                style={{height:280,borderRadius:20,overflow:"hidden",position:"relative",cursor:"default",
                  backgroundImage:`url(${p.img})`,backgroundSize:"cover",backgroundPosition:"center",
                  background:p.fallback}}>
                {/* image réelle par dessus le fallback gradient */}
                <img src={p.img} alt={p.title}
                  style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                  onError={e=>{e.currentTarget.style.display="none";}}/>
                {/* overlay dégradé sombre */}
                <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,
                  background:"linear-gradient(to top,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.2) 50%,rgba(0,0,0,0.1) 100%)"}}/>
                {/* badge icône haut gauche */}
                <div style={{position:"absolute",top:16,left:16,
                  background:"rgba(255,255,255,0.18)",backdropFilter:"blur(8px)",
                  borderRadius:12,padding:"6px 10px",fontSize:20,border:"1px solid rgba(255,255,255,0.25)"}}>
                  {p.icon}
                </div>
                {/* texte bas gauche */}
                <div style={{position:"absolute",bottom:20,left:20,right:20}}>
                  <h3 style={{fontFamily:F.serif,fontWeight:700,fontSize:18,color:"#FFFFFF",margin:"0 0 5px",lineHeight:1.2,textShadow:"0 1px 4px rgba(0,0,0,0.4)"}}>
                    {p.title}
                  </h3>
                  <p style={{fontFamily:F.sans,fontSize:12,color:"rgba(255,255,255,0.82)",margin:0,lineHeight:1.5}}>
                    {p.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <motion.div variants={scaleIn} initial="hidden" whileInView="show" viewport={VP} style={{background:`linear-gradient(135deg,${C.green},${C.greenL})`,borderRadius:22,padding:"2.5rem 2rem",textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:10}}>📋</div>
            <h3 style={{fontFamily:F.serif,fontSize:22,color:C.white,marginBottom:8}}>Demandez votre devis personnalisé</h3>
            <p style={{fontFamily:F.sans,fontSize:14,color:"rgba(255,255,255,0.8)",marginBottom:22,maxWidth:460,margin:"0 auto 22px"}}>Chaque événement est unique. Contactez-nous pour discuter de votre projet.</p>
            <motion.div whileHover={{scale:1.05}} whileTap={{scale:0.97}}><Btn onClick={()=>scrollTo("devis")} variant="gold">🎊 Demander un devis gratuit</Btn></motion.div>
          </motion.div>
        </div>
      </section>
      {/* ── AVIS CLIENTS ── */}
      {approvedReviews.length>0&&(
      <section id="avis" style={{background:"#FAF4E4",padding:"80px 2rem"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={VP} style={{textAlign:"center",marginBottom:"3rem"}}>
            <motion.div variants={fadeUp} style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(200,135,58,0.12)",borderRadius:30,padding:"7px 18px",marginBottom:14}}>
              <span style={{fontFamily:F.sans,fontWeight:800,fontSize:12,color:C.gold}}>⭐ Note moyenne 4.9/5</span>
            </motion.div>
            <motion.h2 variants={fadeUp} style={{fontFamily:F.serif,fontSize:"clamp(2rem,4vw,3rem)",color:C.green,margin:0}}>Ce que disent les familles</motion.h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={VP} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:18}}>
            {approvedReviews.map(r=>(
              <motion.div key={r.id} variants={fadeUp} whileHover={{y:-5,boxShadow:"0 20px 48px rgba(0,0,0,0.1)"}}>
                <Card style={{height:"100%",display:"flex",flexDirection:"column"}}>
                  <div style={{fontSize:24,color:C.gold,marginBottom:10}}>❝</div>
                  <p style={{fontFamily:F.sans,fontSize:13,color:C.textL,lineHeight:1.8,marginBottom:16,fontStyle:"italic",flex:1}}>"{r.text}"</p>
                  <div style={{display:"flex",alignItems:"center",gap:10,borderTop:`1px solid rgba(200,135,58,0.12)`,paddingTop:12,marginTop:"auto"}}>
                    <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},${C.green})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.serif,fontWeight:700,fontSize:16,color:C.white,flexShrink:0}}>{r.parentNom[0]}</div>
                    <div>
                      <div style={{fontFamily:F.sans,fontWeight:700,fontSize:12,color:C.green}}>{r.parentNom}</div>
                      <Stars rating={r.rating}/>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      )}

      {/* GALERIE */}
      <section id="galerie" style={{background:C.lcream,padding:"80px 2rem"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={VP} style={{textAlign:"center",marginBottom:"3rem"}}>
            <motion.div variants={fadeUp} style={{fontFamily:F.sans,fontSize:11,fontWeight:800,letterSpacing:3,textTransform:"uppercase",color:C.gold,marginBottom:10}}>✨ Ils nous font confiance</motion.div>
            <motion.h2 variants={fadeUp} style={{fontFamily:F.serif,fontSize:"clamp(2rem,4vw,3rem)",color:C.green,margin:0}}>Nos Réalisations</motion.h2>
          </motion.div>
          {data.gallery.length>0?(
            <motion.div variants={staggerFast} initial="hidden" whileInView="show" viewport={VP} style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16,marginBottom:"3rem"}}>
              {data.gallery.map(g=>{
                const isCantine=/cantine|école|ecole|enfant|repas|lunch/i.test(g.label);
                return <motion.div key={g.id} variants={fadeUp} whileHover={{y:-6,boxShadow:"0 20px 48px rgba(0,0,0,0.12)"}} style={{background:C.white,borderRadius:18,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.06)",border:`1px solid rgba(200,135,58,0.1)`,transition:"box-shadow 0.25s"}}>
                  <div style={{height:180,overflow:"hidden",background:`linear-gradient(135deg,${C.lcream},#E8E0D0)`,position:"relative"}}>
                    {g.url
                      ?<img src={g.url} alt={g.label} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                          onError={e=>{e.currentTarget.style.display="none";}}/>
                      :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:42}}>🍽️</div>}
                    <div style={{position:"absolute",top:10,right:10}}>
                      <Badge label={isCantine?"🍱 Cantine":"🎊 Événementiel"} color={isCantine?C.green:C.gold}/>
                    </div>
                  </div>
                  <div style={{padding:"0.9rem 1rem"}}>
                    <div style={{fontFamily:F.serif,fontWeight:700,fontSize:14,color:C.green,marginBottom:3}}>{g.label}</div>
                    <div style={{fontFamily:F.sans,fontSize:11,color:C.textL}}>{g.date}</div>
                  </div>
                </motion.div>;
              })}
            </motion.div>
          ):(
            <motion.div variants={staggerFast} initial="hidden" whileInView="show" viewport={VP} style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:12,marginBottom:"3rem"}}>
              {["💍","🏢","🎂","🌙","✨","🥂"].map((emoji,i)=>(
                <motion.div key={i} variants={fadeUp} whileHover={{y:-4}} style={{background:C.white,borderRadius:16,padding:"1.4rem 1rem",textAlign:"center",boxShadow:`0 4px 12px rgba(0,0,0,0.05)`,border:`1px solid rgba(200,135,58,0.1)`}}>
                  <motion.div whileHover={{scale:1.2,rotate:10}} transition={{type:"spring",stiffness:300}} style={{fontSize:36,marginBottom:8}}>{emoji}</motion.div>
                  <div style={{fontFamily:F.serif,fontWeight:700,fontSize:13,color:C.green}}>{["Mariage","Corporate","Anniversaire","Ftour Ramadan","Vente privée","Cocktail"][i]}</div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
      {/* DEVIS */}
      <section id="devis" style={{background:C.white,padding:"80px 2rem"}}>
        <div style={{maxWidth:660,margin:"0 auto"}}>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={VP} style={{textAlign:"center",marginBottom:"2rem"}}>
            <motion.div variants={fadeUp} style={{fontFamily:F.sans,fontSize:11,fontWeight:800,letterSpacing:3,textTransform:"uppercase",color:C.gold,marginBottom:10}}>🎊 Événementiel</motion.div>
            <motion.h2 variants={fadeUp} style={{fontFamily:F.serif,fontSize:"clamp(2rem,4vw,3rem)",color:C.green,margin:0}}>Demandez votre devis</motion.h2>
            <motion.p variants={fadeUp} style={{fontFamily:F.sans,fontSize:14,color:C.textL,marginTop:8}}>Gratuit · Réponse sous 24h</motion.p>
          </motion.div>
          {submitted?(
            <Card style={{textAlign:"center",padding:"3rem"}}>
              <div style={{fontSize:56,marginBottom:14}}>🎉</div>
              <h3 style={{fontFamily:F.serif,fontSize:22,color:C.green,marginBottom:10}}>Demande envoyée !</h3>
              <p style={{fontFamily:F.sans,fontSize:14,color:C.textL,marginBottom:20}}>L'équipe Just Koul vous contacte dans les plus brefs délais.</p>
              <div style={{background:C.lcream,borderRadius:12,padding:"0.8rem 1.2rem",display:"inline-block",marginBottom:20}}>
                <div style={{fontFamily:F.sans,fontSize:13,color:C.textL}}>📱 WhatsApp : <strong style={{color:C.green}}>06 33 95 87 60</strong></div>
              </div><br/>
              <button onClick={()=>setSubmitted(false)} style={{background:"none",border:`2px solid ${C.green}`,borderRadius:18,padding:"9px 22px",fontFamily:F.sans,fontWeight:700,color:C.green,cursor:"pointer"}}>← Nouvelle demande</button>
            </Card>
          ):(
            <Card>
              <h3 style={{fontFamily:F.serif,fontSize:18,color:C.green,marginBottom:"1.2rem"}}>🎊 Demande de devis événement</h3>
              <div className="form-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Inp label="Prénom" value={formContact.prenom} onChange={v=>hf("prenom",v)} required/><Inp label="Nom" value={formContact.nom} onChange={v=>hf("nom",v)} required/></div>
              <Inp label="Téléphone / WhatsApp" value={formContact.tel} onChange={v=>hf("tel",v)} required/>
              <Inp label="Email" type="email" value={formContact.email} onChange={v=>hf("email",v)}/>
              <Inp label="Type d'événement" type="select" value={formContact.typeEvent||""} onChange={v=>hf("typeEvent",v)} options={["","Mariage / Fiançailles","Anniversaire","Corporate","Ftour Ramadan","Vente privée","Cocktail dînatoire","Autre"].map(v=>({id:v,label:v||"Sélectionnez..."}))}/>
              <div className="form-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Inp label="Date" type="date" value={formContact.dateEvent} onChange={v=>hf("dateEvent",v)}/><Inp label="Nombre de personnes" type="number" value={formContact.nbPersonnes} onChange={v=>hf("nbPersonnes",v)} placeholder="Ex: 80"/></div>
              <Inp label="Décrivez votre événement" type="textarea" value={formContact.message} onChange={v=>hf("message",v)} placeholder="Lieu, budget, thème, cuisine souhaitée..."/>
              <Btn onClick={()=>{if(formContact.nom||formContact.prenom){
                const tmp=`tmp_${Date.now()}`;
                const newQ={id:tmp,nom:`${formContact.prenom} ${formContact.nom}`,tel:formContact.tel,email:formContact.email,typeEvent:formContact.typeEvent,date:formContact.dateEvent,nbPersonnes:formContact.nbPersonnes,message:formContact.message,status:"new",createdAt:todayStr(),items:[],total:0,deposit:0,depositPaid:false,notes:""};
                setData(d=>({...d,quotes:[...d.quotes,newQ]}));
                supabase.from('quotes').insert(fQ(newQ)).select().single().then(({data:row})=>{if(row)setData(d=>({...d,quotes:d.quotes.map(q=>q.id===tmp?{...q,id:row.id}:q)}));});
                sendWhatsApp(`🎊 *Just Koul — Nouveau devis*\n👤 ${newQ.nom}\n📱 ${newQ.tel}\n🎉 Événement : ${newQ.typeEvent||"Non précisé"}\n📅 Date : ${newQ.date||"À confirmer"}\n👥 ${newQ.nbPersonnes||"?"} personnes\n💬 ${(newQ.message||"").slice(0,100)}`);
                setSubmitted(true);}}} full style={{marginTop:4}}>
                📋 Envoyer ma demande de devis
              </Btn>
              <p style={{textAlign:"center",fontFamily:F.sans,fontSize:11,color:C.textL,marginTop:12}}>Ou WhatsApp : <a href="https://wa.me/212633958760" style={{color:C.gold,fontWeight:700,textDecoration:"none"}}>06 33 95 87 60</a></p>
            </Card>
          )}
        </div>
      </section>
      {/* CONTACT */}
      <section id="contact" style={{background:C.green,padding:"70px 2rem"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={VP} style={{fontFamily:F.serif,fontSize:"clamp(1.8rem,4vw,2.8rem)",color:C.white,margin:"0 0 2rem",textAlign:"center"}}>Nous contacter</motion.h2>
          <motion.div variants={staggerFast} initial="hidden" whileInView="show" viewport={VP} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:18,marginBottom:"2rem"}}>
            {[{icon:"📱",label:"WhatsApp",value:"06 33 95 87 60",href:"https://wa.me/212633958760"},{icon:"📸",label:"Instagram Cantine",value:"@just_koul",href:"https://instagram.com/just_koul"},{icon:"📸",label:"Instagram Buffets",value:"@just_koulbuffet",href:"https://instagram.com/just_koulbuffet"},{icon:"📍",label:"Zone livraison",value:"Agadir & environs",href:null}].map(c=>(
              <motion.div key={c.label} variants={fadeUp} whileHover={c.href?{y:-4,background:"rgba(255,255,255,0.18)"}:{}} onClick={()=>c.href&&window.open(c.href,"_blank")}
                style={{background:"rgba(255,255,255,0.08)",borderRadius:16,padding:"1.4rem",textAlign:"center",border:"1px solid rgba(255,255,255,0.1)",cursor:c.href?"pointer":"default"}}>
                <div style={{fontSize:30,marginBottom:8}}>{c.icon}</div>
                <div style={{fontFamily:F.sans,fontSize:10,fontWeight:800,color:"rgba(255,255,255,0.5)",letterSpacing:2,textTransform:"uppercase",marginBottom:5}}>{c.label}</div>
                <div style={{fontFamily:F.serif,fontWeight:700,fontSize:16,color:C.goldL}}>{c.value}</div>
              </motion.div>
            ))}
          </motion.div>
          <div style={{textAlign:"center",marginTop:"1.5rem"}}>
            <div style={{fontFamily:F.sans,fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:8}}>
              © 2026 Just Koul · Agadir, Maroc · Fait avec ❤️ et des produits frais locaux
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:14,flexWrap:"wrap"}}>
              {[["mentions","Mentions légales"],["cgv","CGV"],["rgpd","Politique de confidentialité"]].map(([k,label])=>(
                <button key={k} onClick={()=>setLegalModal(k)}
                  style={{background:"none",border:"none",cursor:"pointer",fontFamily:F.sans,fontSize:11,color:"rgba(255,255,255,0.4)",padding:0,textDecoration:"underline",textDecorationColor:"rgba(255,255,255,0.15)"}}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
    <AnimatePresence>
      {legalModal&&<LegalModal type={legalModal} onClose={()=>setLegalModal(null)}/>}
    </AnimatePresence>
    <CookieBanner/>
    </>
  );
}

// ═══════════════════════════════════════
//   DASHBOARD LAYOUT (shared sidebar)
// ═══════════════════════════════════════
function DashLayout({color,title,subtitle,tabs,activeTab,setActiveTab,onLogout,children,badges={}}){
  const [collapsed,setCollapsed]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);
  return <div style={{display:"flex",minHeight:"100vh",background:"#F4EFE4",fontFamily:F.sans}}>
    {/* Backdrop mobile */}
    {mobileOpen&&<div onClick={()=>setMobileOpen(false)} className="nm" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:90,display:"none"}}/>}
    {/* Sidebar */}
    <div className={`dash-sidebar${mobileOpen?" open":""}`} style={{width:collapsed?64:220,background:color||C.sidebar,display:"flex",flexDirection:"column",flexShrink:0,transition:"width 0.3s ease,transform 0.3s ease",overflow:"hidden"}}>
      <div style={{padding:collapsed?"1rem 0":"1.2rem 1rem",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:collapsed?"center":"space-between",gap:8}}>
        {!collapsed&&<div>
          <JustKoulLogo size={32} showText={false}/>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginTop:4,letterSpacing:1}}>{subtitle}</div>
        </div>}
        <button onClick={()=>setCollapsed(c=>!c)} className="nd" style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,padding:"5px 8px",cursor:"pointer",color:"rgba(255,255,255,0.6)",fontSize:14,flexShrink:0}}>
          {collapsed?"→":"←"}
        </button>
        <button onClick={()=>setMobileOpen(false)} className="nm" style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,padding:"5px 8px",cursor:"pointer",color:"rgba(255,255,255,0.6)",fontSize:16,flexShrink:0,display:"none"}}>✕</button>
      </div>
      <div style={{padding:collapsed?"0.8rem 0.5rem":"0.8rem",flex:1,overflowY:"auto"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>{setActiveTab(t.id);setMobileOpen(false);}} title={collapsed?t.label:""}
            style={{width:"100%",display:"flex",alignItems:"center",gap:collapsed?0:10,padding:collapsed?"10px 0":"9px 12px",justifyContent:collapsed?"center":"flex-start",background:activeTab===t.id?"rgba(200,135,58,0.2)":"transparent",color:activeTab===t.id?C.goldL:"rgba(255,255,255,0.5)",border:activeTab===t.id?"1px solid rgba(200,135,58,0.25)":"none",borderRadius:10,cursor:"pointer",fontFamily:F.sans,fontWeight:activeTab===t.id?700:500,fontSize:12.5,marginBottom:2,textAlign:"left",position:"relative",transition:"all 0.15s"}}>
            <span style={{fontSize:16,flexShrink:0}}>{t.icon}</span>
            {!collapsed&&<span style={{flex:1}}>{t.label}</span>}
            {!collapsed&&badges[t.id]>0&&<span style={{background:C.red,color:C.white,borderRadius:"50%",width:17,height:17,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,flexShrink:0}}>{badges[t.id]}</span>}
            {collapsed&&badges[t.id]>0&&<span style={{position:"absolute",top:4,right:4,background:C.red,color:C.white,borderRadius:"50%",width:12,height:12,fontSize:7,display:"flex",alignItems:"center",justifyContent:"center"}}>{badges[t.id]}</span>}
          </button>
        ))}
      </div>
      <div style={{padding:collapsed?"0.8rem 0.5rem":"0.8rem"}}>
        <button onClick={onLogout} title={collapsed?"Retour":""} style={{width:"100%",padding:collapsed?"10px 0":"8px",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.4)",border:"none",borderRadius:8,cursor:"pointer",fontFamily:F.sans,fontSize:11,display:"flex",alignItems:"center",justifyContent:collapsed?"center":"flex-start",gap:6}}>
          <span>🚪</span>{!collapsed&&"Retour au site"}
        </button>
      </div>
    </div>
    {/* Main */}
    <div style={{flex:1,overflow:"auto",padding:"1.8rem",minWidth:0}}>
      <button onClick={()=>setMobileOpen(true)} className="nm" style={{background:color||C.sidebar,color:"white",border:"none",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontFamily:F.sans,fontWeight:700,fontSize:13,display:"none",marginBottom:"1rem"}}>
        ☰ Menu
      </button>
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.25}}>
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  </div>;
}

// ═══════════════════════════════════════
//   ADMIN SPACE — DASHBOARD
// ═══════════════════════════════════════
function AdminDashboard({data}){
  const paidInvoices=data.invoices.filter(i=>i.status==="paid");
  const totalRevenue=paidInvoices.reduce((s,i)=>s+(i.total||0),0);
  const pendingInvoices=data.invoices.filter(i=>i.status==="pending"||i.status==="partial");
  const pendingAmount=pendingInvoices.reduce((s,i)=>s+(i.total||0),0);
  const deliveredToday=data.orders.filter(o=>o.delivered).length;
  const totalOrders=data.orders.length;
  const activeClients=data.enrollments.filter(e=>e.status==="validated").length;
  const stockAlerts=data.stock.filter(s=>s.qty<=s.minQty);
  const pendingTasks=data.tasks.filter(t=>t.status==="pending"||t.status==="in_progress");
  const confirmedQuotes=data.quotes.filter(q=>q.status==="confirmed");
  const quoteRevenue=confirmedQuotes.reduce((s,q)=>s+(q.total||0),0);
  const activeTeam=data.team.filter(t=>t.status==="active").length;

  const recentActivity=[
    {icon:"✅",text:"Livraison Youssef Benali confirmée",time:"12:15",color:"#16A34A"},
    {icon:"📝",text:"Nouvelle inscription : Khalid Ouchane",time:"09:30",color:C.blue},
    {icon:"🎊",text:"Devis mariage Amrani confirmé — 9 000 DH",time:"Hier",color:C.gold},
    {icon:"⚠️",text:"Stock bas : Poulet frais (8 kg / min 10 kg)",time:"Hier",color:C.red},
    {icon:"💳",text:"Paiement reçu : Nadia Alami — 4 620 DH",time:"28/04",color:"#16A34A"},
  ];

  return <div>
    <div style={{marginBottom:"1.5rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
      <div>
        <h1 style={{fontFamily:F.serif,fontSize:"clamp(1.5rem,2.5vw,2rem)",color:C.green,margin:0}}>Tableau de bord</h1>
        <div style={{fontFamily:F.sans,fontSize:12,color:C.textL,marginTop:4}}>Bonjour ! Voici un résumé de l'activité Just Koul · {new Date().toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <Badge label={`${activeTeam} actifs`} color={C.green}/>
        <Badge label={`${stockAlerts.length} alertes stock`} color={stockAlerts.length>0?C.red:C.teal}/>
      </div>
    </div>

    {/* KPI Cards */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:"1.5rem"}}>
      <KpiCard icon="💰" label="Chiffre d'affaires" value={fmtK(totalRevenue)+" DH"} sub="Factures payées" color={C.green} trend={12}/>
      <KpiCard icon="⏳" label="En attente paiement" value={fmt(pendingAmount)} sub={`${pendingInvoices.length} facture${pendingInvoices.length>1?"s":""}`} color={C.orange} trend={-5}/>
      <KpiCard icon="🎊" label="Devis confirmés" value={fmt(quoteRevenue)} sub={`${confirmedQuotes.length} événement${confirmedQuotes.length>1?"s":""}`} color={C.purple} trend={8}/>
      <KpiCard icon="👨‍👩‍👧" label="Familles actives" value={activeClients} sub={`${data.enrollments.length} total inscrits`} color={C.blue} trend={3}/>
      <KpiCard icon="🍱" label="Repas livrés" value={deliveredToday} sub={`sur ${totalOrders} commandés`} color={C.teal} trend={0}/>
      <KpiCard icon="⚠️" label="Alertes stock" value={stockAlerts.length} sub="Articles en rupture" color={stockAlerts.length>0?C.red:C.teal}/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:"1.5rem"}}>
      {/* Revenue chart */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:F.serif,fontSize:16,color:C.green}}>📊 Revenus — 7 derniers jours</div>
          <Badge label="Cette semaine" color={C.gold}/>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:8,height:100}}>
          {(data.revenueWeekly||[38,55,42,68,72,85,61]).map((v,i)=>{
            const max=Math.max(...(data.revenueWeekly||[38,55,42,68,72,85,61]));
            return <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{fontFamily:F.sans,fontSize:9,color:C.textL}}>{fmt(v*80)}</div>
              <motion.div initial={{height:0}} animate={{height:`${(v/max)*80}px`}} transition={{duration:0.7,delay:i*0.06,ease:[0.22,1,0.36,1]}}
                style={{width:"100%",background:i===6?C.green:C.gold+"90",borderRadius:"4px 4px 0 0",minHeight:3}}/>
              <span style={{fontFamily:F.sans,fontSize:9,color:C.textL,fontWeight:700}}>{["L","M","M","J","V","S","D"][i]}</span>
            </div>;
          })}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:12,padding:"8px 12px",background:C.lcream,borderRadius:10}}>
          <div style={{fontFamily:F.sans,fontSize:12,color:C.textL}}>Total semaine</div>
          <div style={{fontFamily:F.serif,fontWeight:700,fontSize:14,color:C.green}}>{fmt((data.revenueWeekly||[38,55,42,68,72,85,61]).reduce((a,b)=>a+b*80,0))}</div>
        </div>
      </Card>

      {/* Today's orders pipeline */}
      <Card>
        <div style={{fontFamily:F.serif,fontSize:15,color:C.green,marginBottom:14}}>🍱 Livraisons du jour</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[{label:"Commandées",count:totalOrders,color:C.blue},{label:"En route",count:Math.floor(totalOrders*0.3),color:C.orange},{label:"Livrées",count:deliveredToday,color:"#16A34A"},{label:"Problèmes",count:0,color:C.red}].map(s=>(
            <div key={s.label} style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:10,background:s.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.serif,fontWeight:700,fontSize:15,color:s.color}}>{s.count}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:F.sans,fontSize:12,fontWeight:700,color:C.text}}>{s.label}</div>
                <div style={{height:4,background:s.color+"20",borderRadius:2,marginTop:3}}>
                  <motion.div initial={{width:0}} animate={{width:`${totalOrders>0?(s.count/totalOrders)*100:0}%`}} transition={{duration:0.8,delay:0.2}} style={{height:"100%",background:s.color,borderRadius:2}}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
      {/* Stock alerts */}
      <Card>
        <div style={{fontFamily:F.serif,fontSize:15,color:C.green,marginBottom:12}}>📦 Alertes stock</div>
        {stockAlerts.length===0?<EmptyState icon="✅" title="Stock OK" sub="Tous les articles sont suffisants"/>:
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {stockAlerts.slice(0,4).map(s=>(
              <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"rgba(192,57,43,0.06)",borderRadius:10,border:`1px solid rgba(192,57,43,0.15)`}}>
                <div>
                  <div style={{fontFamily:F.sans,fontWeight:700,fontSize:12,color:C.text}}>{s.name}</div>
                  <div style={{fontSize:10,color:C.textL}}>{s.qty} {s.unit} / min {s.minQty} {s.unit}</div>
                </div>
                <Badge label="⚠ Bas" color={C.red}/>
              </div>
            ))}
            {stockAlerts.length>4&&<div style={{fontSize:11,color:C.textL,textAlign:"center"}}>+{stockAlerts.length-4} autres alertes</div>}
          </div>
        }
      </Card>

      {/* Team today */}
      <Card>
        <div style={{fontFamily:F.serif,fontSize:15,color:C.green,marginBottom:12}}>👥 Équipe aujourd'hui</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {data.team.map(m=>(
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:m.status==="active"?C.green+"22":C.orange+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{m.avatar}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:F.sans,fontWeight:700,fontSize:12,color:C.text}}>{m.prenom} {m.nom}</div>
                <div style={{fontSize:10,color:C.textL}}>{m.role}</div>
              </div>
              <StatusBadge status={m.status}/>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent activity */}
      <Card>
        <div style={{fontFamily:F.serif,fontSize:15,color:C.green,marginBottom:12}}>🔔 Activité récente</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {recentActivity.map((a,i)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{width:28,height:28,borderRadius:8,background:a.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{a.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:F.sans,fontSize:11,fontWeight:600,color:C.text,lineHeight:1.4}}>{a.text}</div>
                <div style={{fontSize:10,color:C.textL,marginTop:2}}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* Tasks quick view */}
    <div style={{marginTop:16}}>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontFamily:F.serif,fontSize:15,color:C.green}}>✅ Tâches en cours</div>
          <Badge label={`${pendingTasks.length} active${pendingTasks.length>1?"s":""}`} color={C.blue}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10}}>
          {pendingTasks.map(t=>{
            const member=data.team.find(m=>m.id===t.assignee);
            return <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:C.lcream,borderRadius:12,border:`1px solid rgba(200,135,58,0.12)`}}>
              <div style={{fontSize:16}}>{t.priority==="high"?"🔴":"🟡"}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:F.sans,fontWeight:700,fontSize:12,color:C.text}}>{t.title}</div>
                <div style={{fontSize:10,color:C.textL}}>{member?`${member.prenom} ${member.nom}`:""} · Échéance {t.dueDate}</div>
              </div>
              <StatusBadge status={t.status}/>
            </div>;
          })}
        </div>
      </Card>
    </div>
  </div>;
}

// ═══════════════════════════════════════
//   ADMIN — COMMANDES
// ═══════════════════════════════════════
function AdminCommandes({data,setData}){
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const [showAddClient,setShowAddClient]=useState(false);
  const [showAddOrder,setShowAddOrder]=useState(false);
  const ECLIENT={parentPrenom:"",parentNom:"",tel:"",email:"",school:"al-hanane",autreEcole:"",nbEnfants:1,formule:"mensuel",repasType:"pe",days:{lundi:true,mardi:true,mercredi:true,jeudi:true},notes:""};
  const [clientForm,setClientForm]=useState(ECLIENT);
  const hcf=(k,v)=>setClientForm(f=>({...f,[k]:v}));
  const EORDER={enrollId:"",childName:"",menu:"",date:todayStr(),note:""};
  const [orderForm,setOrderForm]=useState(EORDER);
  const hof=(k,v)=>setOrderForm(f=>({...f,[k]:v}));

  const val=async(id,status)=>{
    setData(d=>({...d,enrollments:d.enrollments.map(e=>e.id===id?{...e,status}:e)}));
    await supabase.from('enrollments').update({status}).eq('id',id);
    if(status==="validated"){
      const enroll=data.enrollments.find(e=>e.id===id);
      if(enroll?.email)await sendEmail(enroll.email,"🎉 Votre inscription est confirmée — Just Koul",emailHtmlConfirm(enroll.parentPrenom,enroll));
      if(enroll){
        const formLabel=FORMULES.find(f=>f.id===enroll.formule)?.label||enroll.formule||"";
        await sendWhatsApp(`✅ *Just Koul — Commande validée*\n👤 ${enroll.parentPrenom} ${enroll.parentNom}\n📋 Formule : ${formLabel}\n💰 Montant : ${enroll.amount} DH\n📱 Tel : ${enroll.tel}`);
      }
    }
  };

  const saveClient=()=>{
    const nb=Number(clientForm.nbEnfants)||1;
    const p=calcPrice(clientForm.formule,clientForm.repasType,nb,clientForm.school);
    const tmp=`tmp_${Date.now()}`;
    const newE={id:tmp,parentNom:clientForm.parentNom,parentPrenom:clientForm.parentPrenom,tel:clientForm.tel,email:clientForm.email,school:clientForm.school,autreEcole:clientForm.autreEcole,children:Array.from({length:nb},(_,i)=>({nom:clientForm.parentNom,prenom:`Enfant ${i+1}`,classe:""})),formule:clientForm.formule,repasType:clientForm.repasType,days:clientForm.days,status:"validated",payStatus:"pending",payMethod:"",amount:p.total,discount:p.disc,delivery:p.delivery,invoiceValidated:false,notes:clientForm.notes,createdAt:todayStr()};
    setData(d=>({...d,enrollments:[newE,...d.enrollments]}));
    supabase.from('enrollments').insert(fE(newE)).select().single().then(({data:row})=>{if(row)setData(d=>({...d,enrollments:d.enrollments.map(e=>e.id===tmp?{...e,id:row.id}:e)}));});
    setClientForm(ECLIENT);setShowAddClient(false);
  };

  const saveOrder=()=>{
    if(!orderForm.enrollId||!orderForm.menu)return;
    const tmp=`tmp_${Date.now()}`;
    const newO={id:tmp,enrollId:orderForm.enrollId,date:orderForm.date,menu:orderForm.menu,delivered:false,deliveredAt:"",note:orderForm.note,childName:orderForm.childName};
    setData(d=>({...d,orders:[newO,...d.orders]}));
    supabase.from('orders').insert({enroll_id:orderForm.enrollId,date:orderForm.date,menu:orderForm.menu,delivered:false,note:orderForm.note,child_name:orderForm.childName}).select().single().then(({data:row})=>{if(row)setData(d=>({...d,orders:d.orders.map(o=>o.id===tmp?{...o,id:row.id}:o)}));});
    setOrderForm(EORDER);setShowAddOrder(false);
  };

  const filtered=data.enrollments.filter(e=>{
    if(filter==="pending"&&e.status!=="pending")return false;
    if(filter==="validated"&&e.status!=="validated")return false;
    if(search&&!`${e.parentPrenom} ${e.parentNom} ${e.tel}`.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });

  return <div>
    <STitle icon="📋" label="Gestion" title="Commandes Cantine"
      action={<div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{padding:"7px 12px",fontFamily:F.sans,fontSize:12,border:`1.5px solid rgba(200,135,58,0.3)`,borderRadius:10,outline:"none",width:180}}/>
        {["all","pending","validated"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 14px",fontFamily:F.sans,fontWeight:700,fontSize:11,cursor:"pointer",border:"none",borderRadius:12,background:filter===f?C.green:"rgba(44,74,30,0.08)",color:filter===f?C.white:C.green}}>
          {{all:"Toutes",pending:"En attente",validated:"Validées"}[f]}
        </button>)}
        <Btn small variant="gold" onClick={()=>setShowAddOrder(true)}>+ Commande</Btn>
        <Btn small onClick={()=>setShowAddClient(true)}>+ Nouveau client</Btn>
      </div>}/>

    {/* Stats strip */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:"1.2rem"}}>
      {[{label:"Total",count:data.enrollments.length,color:C.green},{label:"En attente",count:data.enrollments.filter(e=>e.status==="pending").length,color:C.orange},{label:"Validées",count:data.enrollments.filter(e=>e.status==="validated").length,color:"#16A34A"},{label:"Enfants",count:data.enrollments.reduce((s,e)=>s+e.children.length,0),color:C.blue}].map(s=>(
        <Card key={s.label} style={{padding:"0.9rem",textAlign:"center"}}>
          <div style={{fontFamily:F.serif,fontWeight:700,fontSize:22,color:s.color}}>{s.count}</div>
          <div style={{fontFamily:F.sans,fontSize:11,color:C.textL}}>{s.label}</div>
        </Card>
      ))}
    </div>

    <Card style={{padding:0,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <THead cols={["Client","École","Enfants","Formule","Montant","Statut","Action"]}/>
          <tbody>
            {filtered.map((e,i)=>{
              const price=calcPrice(e.formule,e.repasType,e.children.length,e.school);
              return <TRow key={e.id} even={i%2===0} onClick={()=>setSelected(e)}
                cells={[
                  <div><div style={{fontWeight:700,fontSize:13,color:C.green}}>{e.parentPrenom} {e.parentNom}</div><div style={{fontSize:11,color:C.textL}}>{e.tel}</div></div>,
                  <span style={{fontSize:12}}>{SCHOOLS.find(s=>s.id===e.school)?.label}</span>,
                  <span style={{fontSize:12}}>{e.children.map(c=>`${c.prenom}`).join(", ")}</span>,
                  <span style={{fontSize:12}}>{FORMULES.find(f=>f.id===e.formule)?.label}</span>,
                  <span style={{fontWeight:700,color:C.gold}}>{fmt(price.total)}</span>,
                  <StatusBadge status={e.status}/>,
                ]}
                actions={e.status==="pending"?<div style={{display:"flex",gap:6}}>
                  <Btn small onClick={(ev)=>{ev.stopPropagation();val(e.id,"validated")}}>✓ Valider</Btn>
                  <Btn small variant="danger" onClick={(ev)=>{ev.stopPropagation();val(e.id,"rejected")}}>✕</Btn>
                </div>:<Badge label="✓ Traité" color="#16A34A"/>}
              />;
            })}
          </tbody>
        </table>
      </div>
    </Card>

    {/* Detail modal */}
    <AnimatePresence>
      {showAddClient&&<Modal title="Nouveau client" onClose={()=>setShowAddClient(false)} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Prénom" value={clientForm.parentPrenom} onChange={v=>hcf("parentPrenom",v)} required/>
          <Inp label="Nom" value={clientForm.parentNom} onChange={v=>hcf("parentNom",v)} required/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Téléphone" value={clientForm.tel} onChange={v=>hcf("tel",v)} required/>
          <Inp label="Email" type="email" value={clientForm.email} onChange={v=>hcf("email",v)}/>
        </div>
        <Inp label="École" type="select" value={clientForm.school} onChange={v=>hcf("school",v)} options={SCHOOLS}/>
        {clientForm.school==="autre"&&<Inp label="Nom de l'école" value={clientForm.autreEcole} onChange={v=>hcf("autreEcole",v)}/>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Nombre d'enfants" type="select" value={clientForm.nbEnfants} onChange={v=>hcf("nbEnfants",v)} options={[1,2,3,4,5].map(n=>({id:n,label:`${n} enfant${n>1?"s":""}`}))}/>
          <Inp label="Formule" type="select" value={clientForm.formule} onChange={v=>hcf("formule",v)} options={FORMULES.map(f=>({id:f.id,label:f.label}))}/>
        </div>
        <Inp label="Type repas" type="select" value={clientForm.repasType} onChange={v=>hcf("repasType",v)} options={[{id:"pe",label:"Plat + entrée ou dessert"},{id:"cpd",label:"Complet (entrée + plat + dessert)"}]}/>
        <div style={{marginBottom:14}}>
          <div style={{fontFamily:F.sans,fontWeight:700,fontSize:11,color:C.green,marginBottom:7}}>Jours</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {DAYS.map(d=><label key={d} style={{display:"flex",alignItems:"center",gap:5,fontFamily:F.sans,fontSize:12,fontWeight:600,cursor:"pointer",padding:"6px 12px",borderRadius:14,background:clientForm.days?.[d]?C.green:"rgba(44,74,30,0.07)",color:clientForm.days?.[d]?C.white:C.green}}>
              <input type="checkbox" checked={clientForm.days?.[d]||false} onChange={e=>hcf("days",{...clientForm.days,[d]:e.target.checked})} style={{display:"none"}}/>{d.charAt(0).toUpperCase()+d.slice(1)}
            </label>)}
          </div>
        </div>
        <Inp label="Notes" type="textarea" value={clientForm.notes} onChange={v=>hcf("notes",v)} placeholder="Allergies, informations utiles..."/>
        <Btn onClick={saveClient} full disabled={!clientForm.parentNom||!clientForm.tel}>✓ Créer le client (statut : validé)</Btn>
      </Modal>}
      {showAddOrder&&<Modal title="Nouvelle commande" onClose={()=>setShowAddOrder(false)}>
        <Inp label="Client" type="select" value={orderForm.enrollId} onChange={v=>hof("enrollId",v)} options={[{id:"",label:"Sélectionnez un client"},...data.enrollments.filter(e=>e.status==="validated").map(e=>({id:e.id,label:`${e.parentPrenom} ${e.parentNom}`}))]}/>
        {orderForm.enrollId&&<Inp label="Enfant" type="select" value={orderForm.childName} onChange={v=>hof("childName",v)} options={[{id:"",label:"Sélectionnez un enfant"},...(data.enrollments.find(e=>e.id===orderForm.enrollId)?.children||[]).map(c=>({id:`${c.prenom} ${c.nom}`,label:`${c.prenom} ${c.nom}`}))]}/>}
        <Inp label="Date" type="date" value={orderForm.date} onChange={v=>hof("date",v)} required/>
        <Inp label="Menu" value={orderForm.menu} onChange={v=>hof("menu",v)} placeholder="Ex: Poulet rôti & riz pilaf" required/>
        <Inp label="Note" value={orderForm.note} onChange={v=>hof("note",v)} placeholder="Remarques éventuelles"/>
        <Btn onClick={saveOrder} full disabled={!orderForm.enrollId||!orderForm.menu}>✓ Créer la commande</Btn>
      </Modal>}
      {selected&&<Modal title={`Commande — ${selected.parentPrenom} ${selected.parentNom}`} onClose={()=>setSelected(null)} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div>
            <div style={{fontFamily:F.sans,fontWeight:700,fontSize:11,color:C.gold,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Informations parent</div>
            {[["Nom",`${selected.parentPrenom} ${selected.parentNom}`],["Téléphone",selected.tel],["Email",selected.email],["École",SCHOOLS.find(s=>s.id===selected.school)?.label],["Créé le",selected.createdAt]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid rgba(200,135,58,0.1)`,fontSize:13}}>
                <span style={{color:C.textL}}>{k}</span><span style={{fontWeight:700,color:C.text,textAlign:"right",maxWidth:200}}>{v}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{fontFamily:F.sans,fontWeight:700,fontSize:11,color:C.gold,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Enfants & Formule</div>
            {selected.children.map((c,i)=>(
              <div key={i} style={{padding:"8px 10px",background:C.lcream,borderRadius:10,marginBottom:8,fontSize:13}}>
                <strong>{c.prenom} {c.nom}</strong> — {c.classe}
              </div>
            ))}
            <div style={{marginTop:10,padding:"10px 12px",background:C.lcream,borderRadius:10,fontSize:13}}>
              <div><strong>Formule :</strong> {FORMULES.find(f=>f.id===selected.formule)?.label}</div>
              <div><strong>Type :</strong> {selected.repasType==="pe"?"Plat + entrée ou dessert":"Complet"}</div>
              <div><strong>Jours :</strong> {DAYS.filter(d=>selected.days?.[d]).map(d=>d.charAt(0).toUpperCase()+d.slice(1)).join(", ") || "Aucun"}</div>
            </div>
            <div style={{marginTop:10,padding:"12px",background:`linear-gradient(135deg,${C.green},${C.greenL})`,borderRadius:12,color:C.white,fontSize:13}}>
              {[["Base",fmt(calcPrice(selected.formule,selected.repasType,selected.children.length,selected.school).base)],["Total",fmt(calcPrice(selected.formule,selected.repasType,selected.children.length,selected.school).total)]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between"}}><span>{k}</span><strong style={{color:C.goldL}}>{v}</strong></div>
              ))}
            </div>
          </div>
        </div>
        {selected.status==="pending"&&<div style={{display:"flex",gap:10,marginTop:16}}>
          <Btn onClick={()=>{val(selected.id,"validated");setSelected(null);}} style={{flex:1}}>✓ Valider la commande</Btn>
          <Btn variant="danger" onClick={()=>{val(selected.id,"rejected");setSelected(null);}}>✕ Refuser</Btn>
        </div>}
      </Modal>}
    </AnimatePresence>
  </div>;
}

// ═══════════════════════════════════════
//   ADMIN — STOCKS
// ═══════════════════════════════════════
function AdminStocks({data,setData}){
  const [cat,setCat]=useState("all");
  const [showAdd,setShowAdd]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({name:"",category:"Protéines",unit:"kg",qty:0,minQty:5,costUnit:0,supplier:""});
  const [saved,setSaved]=useState(false);
  const h=(k,v)=>setForm(f=>({...f,[k]:v}));

  const FORM_EMPTY={name:"",category:"Protéines",unit:"kg",qty:0,minQty:5,costUnit:0,supplier:""};

  const flash=()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const reloadStock=async()=>{
    const {data:rows,error}=await supabase.from('stock').select('*');
    if(error){console.error('stock reload error:',error);return;}
    setData(d=>({...d,stock:(rows||[]).map(tS)}));
  };

  const categories=["all",...[...new Set(data.stock.map(s=>s.category))]];
  const filtered=cat==="all"?data.stock:data.stock.filter(s=>s.category===cat);
  const alerts=data.stock.filter(s=>s.qty<=s.minQty);
  const totalValue=data.stock.reduce((s,item)=>s+item.qty*item.costUnit,0);

  const saveItem=async()=>{
    if(editing){
      const updated={...editing,...form,qty:Number(form.qty),minQty:Number(form.minQty),costUnit:Number(form.costUnit),lastUpdated:todayStr()};
      setData(d=>({...d,stock:d.stock.map(s=>s.id===editing.id?updated:s)}));
      const {error}=await supabase.from('stock').update(fS(updated)).eq('id',editing.id);
      if(error){console.error('stock update error:',error);alert('Erreur sauvegarde : '+error.message);return;}
    } else {
      const {data:row,error}=await supabase.from('stock').insert(fS({...form,qty:Number(form.qty),minQty:Number(form.minQty),costUnit:Number(form.costUnit)})).select().single();
      if(error){console.error('stock insert error:',error);alert('Erreur ajout : '+error.message);return;}
      if(row)setData(d=>({...d,stock:[...d.stock,tS(row)]}));
    }
    await reloadStock();
    flash();
    setShowAdd(false);setEditing(null);setForm(FORM_EMPTY);
  };
  const deleteItem=async(id)=>{
    if(!window.confirm("Supprimer cet article du stock ?"))return;
    setData(d=>({...d,stock:d.stock.filter(s=>s.id!==id)}));
    const {error}=await supabase.from('stock').delete().eq('id',id);
    if(error){console.error('stock delete error:',error);await reloadStock();return;}
    flash();
  };
  const updateQty=async(id,delta)=>{
    const item=data.stock.find(s=>s.id===id);
    if(!item)return;
    const newQty=Math.max(0,item.qty+delta);
    setData(d=>({...d,stock:d.stock.map(s=>s.id===id?{...s,qty:newQty,lastUpdated:todayStr()}:s)}));
    const {error}=await supabase.from('stock').update({qty:newQty,last_updated:new Date().toISOString()}).eq('id',id);
    if(error){console.error('stock qty error:',error);await reloadStock();return;}
    if(newQty<=item.minQty){
      await sendWhatsApp(`⚠️ *Just Koul — Stock bas*\n📦 ${item.name}\n📊 Stock actuel : ${newQty} ${item.unit}\n🔴 Minimum requis : ${item.minQty} ${item.unit}\n→ Commander chez : ${item.supplier||"?"}`);
    }
    flash();
  };

  return <div>
    <STitle icon="📦" label="Inventaire" title="Gestion des Stocks"
      action={<div style={{display:"flex",gap:10,alignItems:"center"}}>
        <AnimatePresence>
          {saved&&<motion.div key="sv" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:10}} style={{fontFamily:F.sans,fontSize:12,fontWeight:700,color:"#16A34A",padding:"5px 12px",background:"#F0FDF4",borderRadius:12,border:"1px solid #BBF7D0",whiteSpace:"nowrap"}}>✓ Sauvegardé</motion.div>}
        </AnimatePresence>
        <Btn variant="gold" onClick={()=>{setShowAdd(true);setEditing(null);setForm(FORM_EMPTY);}}>+ Ajouter un article</Btn>
      </div>}/>

    {/* KPIs */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:"1.2rem"}}>
      <KpiCard icon="📦" label="Articles en stock" value={data.stock.length} color={C.teal}/>
      <KpiCard icon="⚠️" label="Alertes rupture" value={alerts.length} color={alerts.length>0?C.red:C.teal}/>
      <KpiCard icon="💰" label="Valeur totale stock" value={fmt(totalValue)} color={C.green}/>
      <KpiCard icon="🔄" label="Mis à jour aujourd'hui" value={data.stock.filter(s=>s.lastUpdated===todayStr()).length} color={C.blue}/>
    </div>

    {/* Category tabs */}
    <div style={{display:"flex",gap:8,marginBottom:"1rem",flexWrap:"wrap"}}>
      {categories.map(c=>(
        <button key={c} onClick={()=>setCat(c)} style={{padding:"6px 14px",fontFamily:F.sans,fontWeight:700,fontSize:11,cursor:"pointer",border:`1px solid rgba(200,135,58,0.3)`,borderRadius:12,background:cat===c?C.green:C.white,color:cat===c?C.white:C.green,transition:"all 0.2s"}}>
          {c==="all"?"Tous":c} {c!=="all"&&`(${data.stock.filter(s=>s.category===c).length})`}
        </button>
      ))}
    </div>

    <Card style={{padding:0,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <THead cols={["Article","Catégorie","Stock actuel","Minimum","Statut","Prix unitaire","Fournisseur","Valeur","Actions"]}/>
          <tbody>
            {filtered.map((s,i)=>{
              const status=s.qty<=s.minQty*0.5?"low":s.qty<=s.minQty?"pending":"ok";
              return <TRow key={s.id} even={i%2===0} cells={[
                <div style={{fontWeight:700,fontSize:12,color:C.text}}>{s.name}</div>,
                <Badge label={s.category} color={C.teal}/>,
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <Btn small variant="ghost" onClick={()=>updateQty(s.id,-1)} style={{padding:"3px 8px",minWidth:24}}>−</Btn>
                  <span style={{fontFamily:F.serif,fontWeight:700,fontSize:14,color:status==="low"?C.red:status==="pending"?C.orange:"#16A34A",minWidth:40,textAlign:"center"}}>{s.qty} {s.unit}</span>
                  <Btn small variant="ghost" onClick={()=>updateQty(s.id,1)} style={{padding:"3px 8px",minWidth:24}}>+</Btn>
                </div>,
                <span style={{fontSize:12,color:C.textL}}>{s.minQty} {s.unit}</span>,
                <StatusBadge status={status==="ok"?"ok":status==="pending"?"pending":"low"}/>,
                <span style={{fontWeight:700,color:C.gold}}>{s.costUnit} DH/{s.unit}</span>,
                <span style={{fontSize:11,color:C.textL}}>{s.supplier}</span>,
                <span style={{fontWeight:700,color:C.green}}>{fmt(s.qty*s.costUnit)}</span>,
              ]}
              actions={<div style={{display:"flex",gap:5}}>
                <Btn small variant="ghost" onClick={()=>{setEditing(s);setForm({name:s.name,category:s.category,unit:s.unit,qty:s.qty,minQty:s.minQty,costUnit:s.costUnit,supplier:s.supplier});setShowAdd(true);}}>✏️</Btn>
                <Btn small variant="danger" onClick={()=>deleteItem(s.id)}>🗑</Btn>
              </div>}/>;
            })}
          </tbody>
        </table>
      </div>
    </Card>

    <AnimatePresence>
      {showAdd&&<Modal title={editing?"Modifier l'article":"Ajouter un article"} onClose={()=>{setShowAdd(false);setEditing(null);}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Inp label="Nom de l'article" value={form.name} onChange={v=>h("name",v)} required/>
          <Inp label="Catégorie" type="select" value={form.category} onChange={v=>h("category",v)} options={["Protéines","Légumes","Féculents","Épicerie","Condiments","Fruits","Produits laitiers","Emballages"].map(c=>({id:c,label:c}))}/>
          <Inp label="Unité" type="select" value={form.unit} onChange={v=>h("unit",v)} options={["kg","L","unité","botte","boîte"].map(u=>({id:u,label:u}))}/>
          <Inp label="Quantité actuelle" type="number" value={form.qty} onChange={v=>h("qty",Number(v))}/>
          <Inp label="Quantité minimale" type="number" value={form.minQty} onChange={v=>h("minQty",Number(v))} hint="Alerte déclenchée sous ce seuil"/>
          <Inp label="Prix unitaire (DH)" type="number" value={form.costUnit} onChange={v=>h("costUnit",Number(v))}/>
        </div>
        <Inp label="Fournisseur" value={form.supplier} onChange={v=>h("supplier",v)} placeholder="Nom du fournisseur"/>
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <Btn onClick={saveItem} style={{flex:1}}>{editing?"Mettre à jour":"Ajouter au stock"}</Btn>
          <Btn variant="ghost" onClick={()=>{setShowAdd(false);setEditing(null);}}>Annuler</Btn>
        </div>
      </Modal>}
    </AnimatePresence>
  </div>;
}

// ═══════════════════════════════════════
//   ADMIN — ÉQUIPE
// ═══════════════════════════════════════
function AdminEquipe({data,setData}){
  const [view,setView]=useState("team");
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({nom:"",prenom:"",role:"",tel:"",email:"",status:"active",avatar:"👤",salary:0,startDate:"",note:"",schedule:{lundi:true,mardi:true,mercredi:true,jeudi:true,vendredi:false}});
  const h=(k,v)=>setForm(f=>({...f,[k]:v}));
  const hs=(d,v)=>setForm(f=>({...f,schedule:{...f.schedule,[d]:v}}));

  const saveTeam=()=>{
    const tmp=`tmp_${Date.now()}`;
    const newM={id:tmp,...form,salary:Number(form.salary)};
    setData(d=>({...d,team:[...d.team,newM]}));
    supabase.from('team').insert(fT(newM)).select().single().then(({data:row})=>{
      if(row)setData(d=>({...d,team:d.team.map(m=>m.id===tmp?{...m,id:row.id}:m)}));
    });
    setShowAdd(false);
  };
  const updateStatus=(id,status)=>{
    setData(d=>({...d,team:d.team.map(m=>m.id===id?{...m,status}:m)}));
    supabase.from('team').update({status}).eq('id',id);
  };
  const deleteMember=(id,name)=>{
    if(!window.confirm(`Supprimer ${name} de l'équipe ? Cette action est irréversible.`))return;
    setData(d=>({...d,team:d.team.filter(m=>m.id!==id)}));
    supabase.from('team').delete().eq('id',id);
  };
  const addTask=()=>{
    const tmp=`tmp_${Date.now()}`;
    const t={id:tmp,title:"Nouvelle tâche",assignee:data.team[0]?.id||null,dueDate:todayStr(),status:"pending",priority:"medium"};
    setData(d=>({...d,tasks:[...d.tasks,t]}));
    supabase.from('tasks').insert(fTk(t)).select().single().then(({data:row})=>{
      if(row)setData(d=>({...d,tasks:d.tasks.map(tk=>tk.id===tmp?{...tk,id:row.id}:tk)}));
    });
  };
  const taskKeyMap={title:'title',assignee:'assignee',status:'status',priority:'priority',dueDate:'due_date'};
  const updateTask=(id,k,v)=>{
    setData(d=>({...d,tasks:d.tasks.map(t=>t.id===id?{...t,[k]:v}:t)}));
    supabase.from('tasks').update({[taskKeyMap[k]||k]:v}).eq('id',id);
  };
  const deleteTask=id=>{
    setData(d=>({...d,tasks:d.tasks.filter(t=>t.id!==id)}));
    supabase.from('tasks').delete().eq('id',id);
  };

  const roles={primary:{label:"Cuisinière principale",icon:"👩‍🍳"},assistant:{label:"Assistante cuisine",icon:"👩‍🍳"},livreur:{label:"Livreur",icon:"🛵"},commercial:{label:"Commercial(e)",icon:"👩‍💼"}};

  return <div>
    <STitle icon="👥" label="Ressources humaines" title="Gestion de l'Équipe"
      action={<div style={{display:"flex",gap:8}}>
        {["team","planning","tasks"].map(v=><button key={v} onClick={()=>setView(v)} style={{padding:"7px 16px",fontFamily:F.sans,fontWeight:700,fontSize:12,cursor:"pointer",border:"none",borderRadius:12,background:view===v?C.green:"rgba(44,74,30,0.08)",color:view===v?C.white:C.green}}>
          {{"team":"👥 Équipe","planning":"📅 Planning","tasks":"✅ Tâches"}[v]}
        </button>)}
        <Btn variant="gold" small onClick={()=>setShowAdd(true)}>+ Ajouter membre</Btn>
      </div>}/>

    {view==="team"&&(
      <>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:"1.2rem"}}>
          <KpiCard icon="👥" label="Total équipe" value={data.team.length} color={C.green}/>
          <KpiCard icon="✅" label="Actifs aujourd'hui" value={data.team.filter(m=>m.status==="active").length} color={C.teal}/>
          <KpiCard icon="🏖️" label="En congé" value={data.team.filter(m=>m.status==="off").length} color={C.orange}/>
          <KpiCard icon="💰" label="Masse salariale" value={fmt(data.team.reduce((s,m)=>s+m.salary,0))} sub="/ mois" color={C.purple}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14}}>
          {data.team.map(m=>(
            <Card key={m.id}>
              <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                <div style={{width:56,height:56,borderRadius:16,background:m.status==="active"?C.green+"18":C.orange+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{m.avatar}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                    <div style={{fontFamily:F.serif,fontWeight:700,fontSize:16,color:C.green}}>{m.prenom} {m.nom}</div>
                    <StatusBadge status={m.status}/>
                  </div>
                  <div style={{fontFamily:F.sans,fontSize:12,color:C.gold,fontWeight:700,marginTop:2}}>{m.role}</div>
                  <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                    <Badge label={`📱 ${m.tel}`} color={C.blue}/>
                    <Badge label={`💰 ${fmt(m.salary)}/mois`} color={C.purple}/>
                  </div>
                  <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}}>
                    {["lundi","mardi","mercredi","jeudi","vendredi"].map(d=>(
                      <div key={d} style={{padding:"2px 8px",borderRadius:8,background:m.schedule?.[d]?C.green+"20":"rgba(0,0,0,0.04)",color:m.schedule?.[d]?C.green:C.textL,fontSize:9,fontWeight:700}}>{d.slice(0,3).toUpperCase()}</div>
                    ))}
                  </div>
                  {m.note&&<div style={{fontSize:11,color:C.textL,marginTop:6,fontStyle:"italic"}}>{m.note}</div>}
                  <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                    {["active","off","sick"].map(s=><Btn key={s} small variant={m.status===s?"primary":"ghost"} onClick={()=>updateStatus(m.id,s)}>
                      {{active:"✅ Actif",off:"🏖️ Congé",sick:"🤒 Malade"}[s]}
                    </Btn>)}
                    <Btn small variant="danger" onClick={()=>deleteMember(m.id,`${m.prenom} ${m.nom}`)}>🗑</Btn>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>
    )}

    {view==="planning"&&(
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <THead cols={["Membre","Rôle","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Heures/sem"]}/>
            <tbody>
              {data.team.map((m,i)=>{
                const jours=["lundi","mardi","mercredi","jeudi","vendredi"];
                const workedDays=jours.filter(d=>m.schedule?.[d]).length;
                return <TRow key={m.id} even={i%2===0} cells={[
                  <div style={{fontWeight:700,fontSize:13}}>{m.avatar} {m.prenom} {m.nom}</div>,
                  <span style={{fontSize:11,color:C.textL}}>{m.role}</span>,
                  ...jours.map(d=>(
                    <div style={{textAlign:"center"}}>
                      <div style={{width:28,height:28,borderRadius:8,background:m.schedule?.[d]?C.green+"22":"rgba(0,0,0,0.04)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:14}}>
                        {m.schedule?.[d]?"✅":"—"}
                      </div>
                    </div>
                  )),
                  <Badge label={`${workedDays*8}h`} color={C.teal}/>,
                ]}/>;
              })}
            </tbody>
          </table>
        </div>
      </Card>
    )}

    {view==="tasks"&&(
      <>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
          <Btn variant="gold" small onClick={addTask}>+ Nouvelle tâche</Btn>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {data.tasks.map(t=>{
            const member=data.team.find(m=>m.id===t.assignee);
            return <Card key={t.id} style={{padding:"1rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <div style={{fontSize:16}}>{t.priority==="high"?"🔴":t.priority==="medium"?"🟡":"🟢"}</div>
                <input value={t.title} onChange={e=>updateTask(t.id,"title",e.target.value)}
                  style={{flex:1,fontFamily:F.sans,fontWeight:600,fontSize:13,color:C.text,border:"none",background:"transparent",outline:"none",minWidth:150,textDecoration:t.status==="done"?"line-through":"none",color:t.status==="done"?C.textL:C.text}}/>
                <select value={t.assignee} onChange={e=>updateTask(t.id,"assignee",e.target.value)} style={{fontFamily:F.sans,fontSize:11,border:`1px solid rgba(200,135,58,0.3)`,borderRadius:8,padding:"3px 8px",cursor:"pointer",outline:"none"}}>
                  {data.team.map(m=><option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>)}
                </select>
                <select value={t.status} onChange={e=>updateTask(t.id,"status",e.target.value)} style={{fontFamily:F.sans,fontSize:11,border:`1px solid rgba(200,135,58,0.3)`,borderRadius:8,padding:"3px 8px",cursor:"pointer",outline:"none"}}>
                  {["pending","in_progress","done"].map(s=><option key={s} value={s}>{{"pending":"En attente","in_progress":"En cours","done":"Terminé"}[s]}</option>)}
                </select>
                <input type="date" value={t.dueDate} onChange={e=>updateTask(t.id,"dueDate",e.target.value)} style={{fontFamily:F.sans,fontSize:11,border:`1px solid rgba(200,135,58,0.3)`,borderRadius:8,padding:"3px 8px",outline:"none"}}/>
                <Btn small variant="danger" onClick={()=>deleteTask(t.id)}>🗑</Btn>
              </div>
            </Card>;
          })}
        </div>
      </>
    )}

    <AnimatePresence>
      {showAdd&&<Modal title="Ajouter un membre" onClose={()=>setShowAdd(false)} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Inp label="Prénom" value={form.prenom} onChange={v=>h("prenom",v)} required/>
          <Inp label="Nom" value={form.nom} onChange={v=>h("nom",v)} required/>
          <Inp label="Rôle / Poste" value={form.role} onChange={v=>h("role",v)} required/>
          <Inp label="Avatar emoji" value={form.avatar} onChange={v=>h("avatar",v)} hint="Ex: 👩‍🍳 🛵 👩‍💼"/>
          <Inp label="Téléphone" value={form.tel} onChange={v=>h("tel",v)}/>
          <Inp label="Email" type="email" value={form.email} onChange={v=>h("email",v)}/>
          <Inp label="Salaire mensuel (DH)" type="number" value={form.salary} onChange={v=>h("salary",v)}/>
          <Inp label="Date de début" type="date" value={form.startDate} onChange={v=>h("startDate",v)}/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontFamily:F.sans,fontWeight:700,fontSize:11,color:C.green,marginBottom:8}}>Jours travaillés</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["lundi","mardi","mercredi","jeudi","vendredi"].map(d=>(
              <label key={d} style={{display:"flex",alignItems:"center",gap:5,fontFamily:F.sans,fontSize:12,fontWeight:600,cursor:"pointer",padding:"6px 12px",borderRadius:12,background:form.schedule?.[d]?C.green:"rgba(44,74,30,0.08)",color:form.schedule?.[d]?C.white:C.green}}>
                <input type="checkbox" checked={form.schedule?.[d]||false} onChange={e=>hs(d,e.target.checked)} style={{display:"none"}}/>{d.charAt(0).toUpperCase()+d.slice(1)}
              </label>
            ))}
          </div>
        </div>
        <Inp label="Note" type="textarea" value={form.note} onChange={v=>h("note",v)} placeholder="Spécialités, zones de livraison, remarques..."/>
        <Btn onClick={saveTeam} full>Ajouter le membre</Btn>
      </Modal>}
    </AnimatePresence>
  </div>;
}

// ═══════════════════════════════════════
//   ADMIN — FACTURES
// ═══════════════════════════════════════
function AdminFactures({data,setData}){
  const [filter,setFilter]=useState("all");
  const [selected,setSelected]=useState(null);
  const [showCreate,setShowCreate]=useState(false);

  const filtered=data.invoices.filter(i=>filter==="all"||i.status===filter);
  const totalPaid=data.invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+(i.total||0),0);
  const totalPending=data.invoices.filter(i=>i.status==="pending"||i.status==="partial").reduce((s,i)=>s+(i.total||0),0);

  const validateInvoice=id=>{
    setData(d=>({...d,invoices:d.invoices.map(i=>i.id===id?{...i,status:"paid",paidDate:todayStr()}:i)}));
    supabase.from('invoices').update({status:'paid',paid_date:todayStr()}).eq('id',id);
  };
  const updateEnrollInvoice=id=>{
    setData(d=>({...d,enrollments:d.enrollments.map(e=>e.id===id?{...e,invoiceValidated:true}:e)}));
    supabase.from('enrollments').update({invoice_validated:true}).eq('id',id);
  };

  const downloadInvoice=(inv)=>{
    const doc=new jsPDF();
    const pg=doc.internal.pageSize;
    const W=pg.getWidth();
    let y=22;
    // ── EN-TÊTE ──
    doc.setFont("helvetica","bold");
    doc.setFontSize(28);
    doc.setTextColor(44,74,30);
    doc.text("JUST KOUL",W/2,y,{align:"center"});
    y+=9;
    doc.setFont("helvetica","normal");
    doc.setFontSize(11);
    doc.setTextColor(200,135,58);
    doc.text("Eat · Enjoy · Repeat",W/2,y,{align:"center"});
    y+=5;
    doc.setDrawColor(200,135,58);doc.setLineWidth(0.8);
    doc.line(15,y,W-15,y);
    y+=6;
    doc.setFontSize(9);doc.setTextColor(107,82,64);
    doc.text("Agadir, Maroc  |  06 33 95 87 60  |  @just_koul",W/2,y,{align:"center"});
    y+=10;
    // ── BLOC FACTURE ──
    doc.setFont("helvetica","bold");doc.setFontSize(18);doc.setTextColor(44,74,30);
    doc.text(`FACTURE N° ${inv.id}`,15,y);
    y+=8;
    const isPaid=inv.status==="paid";
    doc.setFontSize(11);doc.setFont("helvetica","normal");doc.setTextColor(60,60,60);
    doc.text(`Date d’émission : ${inv.issueDate||"-"}`,15,y);
    doc.text(`Échéance : ${inv.dueDate||"-"}`,W/2,y);
    y+=7;
    doc.setFont("helvetica","bold");
    if(isPaid){doc.setTextColor(22,163,74);doc.text("STATUT : PAYÉE ✓",15,y);}
    else{doc.setTextColor(217,119,6);doc.text("STATUT : EN ATTENTE",15,y);}
    y+=9;
    // ── BLOC CLIENT ──
    doc.setDrawColor(220,210,195);doc.setLineWidth(0.3);doc.line(15,y,W-15,y);y+=6;
    doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(44,74,30);
    doc.text("CLIENT",15,y);y+=6;
    doc.setFont("helvetica","normal");doc.setTextColor(42,31,20);doc.setFontSize(11);
    doc.text(inv.clientNom,15,y);y+=5;
    if(inv.clientTel)doc.text(`Tél : ${inv.clientTel}`,15,y),y+=5;
    y+=4;doc.line(15,y,W-15,y);y+=7;
    // ── TABLEAU ──
    const cols=[100,15,30,25];const colX=[15,115,130,162];
    doc.setFillColor(44,74,30);doc.rect(15,y-4,W-30,8,"F");
    doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(255,255,255);
    ["Description","Qté","Prix unit.","Total"].forEach((h,i)=>doc.text(h,colX[i],y));
    y+=6;
    (inv.items||[]).forEach((item,idx)=>{
      if(y>265){doc.addPage();y=20;}
      const bg=idx%2===0;
      if(bg){doc.setFillColor(250,244,228);doc.rect(15,y-4,W-30,7,"F");}
      doc.setFont("helvetica","normal");doc.setFontSize(9);
      const isNeg=item.total<0;
      doc.setTextColor(isNeg?192:42,isNeg?57:31,isNeg?43:20);
      const desc=item.desc.length>50?item.desc.slice(0,48)+"…":item.desc;
      doc.text(desc,colX[0],y);
      doc.text(String(item.qty),colX[1],y);
      doc.text(fmt(item.unit),colX[2],y);
      doc.text(fmt(item.total),colX[3],y);
      y+=7;
    });
    y+=3;doc.setDrawColor(200,135,58);doc.setLineWidth(0.5);doc.line(15,y,W-15,y);y+=7;
    // Totaux
    doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(107,82,64);
    doc.text(`Sous-total : ${fmt(inv.subtotal)}`,W-15,y,{align:"right"});y+=6;
    if(inv.discount>0){
      doc.setTextColor(22,163,74);
      doc.text(`Réduction : -${fmt(inv.discount)}`,W-15,y,{align:"right"});y+=6;
    }
    if(inv.deposit>0){
      doc.setTextColor(13,148,136);
      doc.text(`Acompte versé : -${fmt(inv.deposit)}`,W-15,y,{align:"right"});y+=6;
    }
    doc.setFont("helvetica","bold");doc.setFontSize(14);doc.setTextColor(44,74,30);
    doc.text(`TOTAL TTC : ${fmt(inv.total)}`,W-15,y,{align:"right"});y+=12;
    // ── PAIEMENT ──
    doc.setDrawColor(220,210,195);doc.setLineWidth(0.3);doc.line(15,y,W-15,y);y+=7;
    doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(44,74,30);
    doc.text("MODES DE PAIEMENT ACCEPTÉS :",15,y);y+=6;
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(60,60,60);
    doc.text("Virement : Banque Populaire du Maroc",15,y);y+=5;
    doc.text("RIB : 101 810 0004800078601 34",15,y);y+=5;
    doc.text("Espèces : au livreur ou en centre",15,y);y+=10;
    // ── PIED DE PAGE ──
    const footY=doc.internal.pageSize.getHeight()-16;
    doc.setDrawColor(200,135,58);doc.setLineWidth(0.6);doc.line(15,footY-8,W-15,footY-8);
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(107,82,64);
    doc.text("Merci de votre confiance ! Just Koul · Agadir · 06 33 95 87 60 · @just_koul",W/2,footY-3,{align:"center"});
    doc.text("© 2026 Just Koul — Tous droits réservés",W/2,footY+3,{align:"center"});
    doc.save(`Facture_${inv.id}_${(inv.clientNom||"inconnu").replace(/\s/g,"_")}.pdf`);
  };

  const statusColors={paid:"#16A34A",pending:C.orange,partial:C.purple,overdue:C.red};

  return <div>
    <STitle icon="🧾" label="Comptabilité" title="Gestion des Factures"
      action={<div style={{display:"flex",gap:8}}>
        {["all","pending","partial","paid"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 12px",fontFamily:F.sans,fontWeight:700,fontSize:11,cursor:"pointer",border:"none",borderRadius:12,background:filter===f?C.green:"rgba(44,74,30,0.08)",color:filter===f?C.white:C.green}}>
          {{all:"Toutes",pending:"En attente",partial:"Acompte",paid:"Payées"}[f]}
        </button>)}
      </div>}/>

    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:"1.2rem"}}>
      <KpiCard icon="💳" label="Total facturé" value={fmt(data.invoices.reduce((s,i)=>s+(i.total||0),0))} color={C.green}/>
      <KpiCard icon="✅" label="Payées" value={fmt(totalPaid)} sub={`${data.invoices.filter(i=>i.status==="paid").length} factures`} color={"#16A34A"} trend={8}/>
      <KpiCard icon="⏳" label="En attente" value={fmt(totalPending)} sub={`${data.invoices.filter(i=>i.status!=="paid").length} factures`} color={C.orange}/>
      <KpiCard icon="📊" label="Taux de recouvrement" value={`${data.invoices.length>0?Math.round(data.invoices.filter(i=>i.status==="paid").length/data.invoices.length*100):0}%`} color={C.teal}/>
    </div>

    <Card style={{padding:0,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <THead cols={["N° Facture","Client","Type","Montant","Émise le","Échéance","Statut","Actions"]}/>
          <tbody>
            {filtered.map((inv,i)=>(
              <TRow key={inv.id} even={i%2===0} onClick={()=>setSelected(inv)} cells={[
                <span style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:C.green}}>{inv.id}</span>,
                <div><div style={{fontWeight:700,fontSize:12}}>{inv.clientNom}</div><div style={{fontSize:10,color:C.textL}}>{inv.clientTel}</div></div>,
                <Badge label={inv.type==="cantine"?"🏫 Cantine":"🎊 Événement"} color={inv.type==="cantine"?C.green:C.purple}/>,
                <div>
                  <div style={{fontWeight:700,color:C.gold}}>{fmt(inv.total)}</div>
                  {inv.deposit>0&&<div style={{fontSize:10,color:C.teal}}>Acompte: {fmt(inv.deposit)}</div>}
                </div>,
                <span style={{fontSize:12,color:C.textL}}>{inv.issueDate}</span>,
                <span style={{fontSize:12,color:inv.status==="paid"?C.textL:C.red}}>{inv.dueDate}</span>,
                <StatusBadge status={inv.status}/>,
              ]}
              actions={<div style={{display:"flex",gap:5}}>
                {(inv.status==="pending"||inv.status==="partial")&&<Btn small onClick={(e)=>{e.stopPropagation();validateInvoice(inv.id);if(inv.enrollId)updateEnrollInvoice(inv.enrollId);}}>✓ Payée</Btn>}
                <Btn small variant="ghost" onClick={(e)=>{e.stopPropagation();downloadInvoice(inv);}}>⬇️ PDF</Btn>
              </div>}/>
            ))}
          </tbody>
        </table>
      </div>
    </Card>

    {/* Invoice detail modal */}
    <AnimatePresence>
      {selected&&<Modal title={`Facture ${selected.id}`} onClose={()=>setSelected(null)} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div>
            <div style={{fontFamily:F.sans,fontWeight:700,fontSize:10,color:C.gold,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Client</div>
            <div style={{fontFamily:F.sans,fontSize:13,fontWeight:700,color:C.green}}>{selected.clientNom}</div>
            <div style={{fontSize:12,color:C.textL}}>{selected.clientTel}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:F.sans,fontWeight:700,fontSize:10,color:C.gold,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Dates</div>
            <div style={{fontSize:12,color:C.textL}}>Émise : {selected.issueDate}</div>
            <div style={{fontSize:12,color:C.textL}}>Échéance : {selected.dueDate}</div>
            {selected.paidDate&&<div style={{fontSize:12,color:"#16A34A",fontWeight:700}}>Payée : {selected.paidDate}</div>}
          </div>
        </div>
        {/* Items */}
        <div style={{background:C.lcream,borderRadius:12,overflow:"hidden",marginBottom:14}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:C.green}}>{["Description","Qté","Prix unit.","Total"].map(h=><th key={h} style={{padding:"8px 12px",color:C.white,fontSize:11,textAlign:"left"}}>{h}</th>)}</tr></thead>
            <tbody>
              {(selected.items||[]).map((item,i)=>(
                <tr key={i} style={{background:i%2===0?C.white:C.lcream}}>
                  <td style={{padding:"8px 12px",fontSize:12}}>{item.desc}</td>
                  <td style={{padding:"8px 12px",fontSize:12,textAlign:"center"}}>{item.qty}</td>
                  <td style={{padding:"8px 12px",fontSize:12,color:item.unit<0?C.red:C.textL}}>{fmt(item.unit)}</td>
                  <td style={{padding:"8px 12px",fontSize:12,fontWeight:700,color:item.total<0?C.red:C.green}}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <div style={{background:`linear-gradient(135deg,${C.green},${C.greenL})`,borderRadius:14,padding:"1rem 1.5rem",color:C.white,minWidth:200}}>
            {selected.discount>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span>Réduction</span><span style={{color:C.goldL}}>−{fmt(selected.discount)}</span></div>}
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:F.serif,fontWeight:700,fontSize:18}}><span>Total</span><span style={{color:C.goldL}}>{fmt(selected.total)}</span></div>
            {selected.deposit>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginTop:6,color:"rgba(255,255,255,0.7)"}}><span>Acompte reçu</span><span>{fmt(selected.deposit)}</span></div>}
          </div>
        </div>
        {selected.notes&&<div style={{marginTop:10,padding:"8px 12px",background:C.lcream,borderRadius:10,fontSize:12,color:C.textL,fontStyle:"italic"}}>Note: {selected.notes}</div>}
        <div style={{display:"flex",gap:10,marginTop:14}}>
          <Btn onClick={()=>downloadInvoice(selected)} style={{flex:1}}>⬇️ Télécharger la facture</Btn>
          {(selected.status==="pending"||selected.status==="partial")&&<Btn variant="gold" onClick={()=>{validateInvoice(selected.id);setSelected(null);}}>✓ Marquer comme payée</Btn>}
        </div>
      </Modal>}
    </AnimatePresence>
  </div>;
}

// ═══════════════════════════════════════
//   ADMIN — DEVIS ÉVÉNEMENTS
// ═══════════════════════════════════════
function AdminDevis({data,setData}){
  const [selected,setSelected]=useState(null);
  const [filter,setFilter]=useState("all");
  const [toast,setToast]=useState("");
  const updateStatus=async(id,status)=>{
    setData(d=>({...d,quotes:d.quotes.map(q=>q.id===id?{...q,status}:q)}));
    await supabase.from('quotes').update({status}).eq('id',id);
    if(status==='confirmed'){
      const quote=data.quotes.find(q=>q.id===id);
      if(!quote)return;
      const{data:existing}=await supabase.from('invoices').select('id').eq('quote_id',id).maybeSingle();
      if(!existing){
        const dateIn30=new Date(Date.now()+30*24*60*60*1000).toISOString().split('T')[0];
        const inv={quote_id:id,type:'evenement',client_nom:quote.nom,client_tel:quote.tel,issue_date:todayStr(),due_date:dateIn30,paid_date:null,status:quote.depositPaid?'partial':'pending',items:quote.items,subtotal:quote.total,discount:0,total:quote.total,deposit:quote.deposit,deposit_paid:quote.depositPaid,notes:`Événement : ${quote.typeEvent} — ${quote.date}`};
        const{data:newRow}=await supabase.from('invoices').insert(inv).select().single();
        if(newRow){setData(d=>({...d,invoices:[tI(newRow),...d.invoices]}));setToast("✅ Facture événement générée automatiquement");}
      }
    }
  };
  const STATUSES=["new","replied","confirmed","done","cancelled"];
  const filtered=filter==="all"?data.quotes:data.quotes.filter(q=>q.status===filter);
  const pipelineCount=st=>data.quotes.filter(q=>q.status===st).length;
  const confirmedRevenue=data.quotes.filter(q=>q.status==="confirmed"||q.status==="done").reduce((s,q)=>s+(q.total||0),0);

  return <div>
    <STitle icon="🎊" label="Événementiel" title="Gestion des Devis"/>

    {/* Pipeline visuel */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:"1.5rem"}}>
      {[{st:"new",label:"Nouveau",icon:"📩",color:C.blue},{st:"replied",label:"Répondu",icon:"💬",color:C.teal},{st:"confirmed",label:"Confirmé",icon:"✅",color:"#16A34A"},{st:"done",label:"Réalisé",icon:"🏆",color:C.gold},{st:"cancelled",label:"Annulé",icon:"❌",color:C.red}].map(s=>(
        <motion.div key={s.st} whileHover={{y:-3}} onClick={()=>setFilter(filter===s.st?"all":s.st)}
          style={{background:filter===s.st?s.color:C.card,borderRadius:14,padding:"1rem 0.8rem",textAlign:"center",border:`2px solid ${filter===s.st?s.color:"rgba(200,135,58,0.12)"}`,cursor:"pointer",boxShadow:`0 4px 14px ${s.color}20`}}>
          <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
          <div style={{fontFamily:F.serif,fontWeight:700,fontSize:20,color:filter===s.st?C.white:s.color}}>{pipelineCount(s.st)}</div>
          <div style={{fontFamily:F.sans,fontSize:10,fontWeight:700,color:filter===s.st?"rgba(255,255,255,0.8)":C.textL,letterSpacing:0.5}}>{s.label}</div>
        </motion.div>
      ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:"1.2rem"}}>
      <KpiCard icon="💰" label="Revenus événements (confirmés)" value={fmt(confirmedRevenue)} color={C.green} trend={15}/>
      <KpiCard icon="📋" label="Total devis reçus" value={data.quotes.length} sub="Tous statuts confondus" color={C.blue}/>
    </div>

    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {filtered.map(q=>(
        <Card key={q.id} onClick={()=>setSelected(q)} style={{cursor:"pointer"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:14,alignItems:"flex-start"}}>
            <div style={{flex:1,minWidth:200}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                <div style={{fontWeight:700,fontSize:15,color:C.green}}>{q.nom}</div>
                <StatusBadge status={q.status}/>
                <Badge label={q.typeEvent} color={C.purple}/>
              </div>
              <div style={{fontSize:12,color:C.textL,lineHeight:1.9}}>
                <div>📱 {q.tel}{q.email?` · ✉️ ${q.email}`:""}</div>
                <div>📅 {q.date} · 👥 {q.nbPersonnes} personnes</div>
                {q.total>0&&<div style={{color:C.gold,fontWeight:700}}>💰 Total estimé : {fmt(q.total)}{q.depositPaid?` · Acompte ${fmt(q.deposit)} reçu ✓`:""}</div>}
                {q.message&&<div style={{fontStyle:"italic",color:C.textL,marginTop:4}}>"{q.message}"</div>}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <select value={q.status} onChange={e=>{e.stopPropagation();updateStatus(q.id,e.target.value);}} style={{fontFamily:F.sans,fontSize:11,border:`1px solid rgba(200,135,58,0.3)`,borderRadius:8,padding:"5px 8px",cursor:"pointer",outline:"none"}} onClick={e=>e.stopPropagation()}>
                {STATUSES.map(s=><option key={s} value={s}>{{"new":"Nouveau","replied":"Répondu","confirmed":"Confirmé","done":"Réalisé","cancelled":"Annulé"}[s]}</option>)}
              </select>
              <a href={`https://wa.me/212${(q.tel||"").replace(/^0/,"")}`} target="_blank" rel="noreferrer" style={{textDecoration:"none"}} onClick={e=>e.stopPropagation()}>
                <Btn small variant="ghost" style={{width:"100%"}}>📱 WhatsApp</Btn>
              </a>
            </div>
          </div>
        </Card>
      ))}
    </div>

    {/* Detail modal with line items */}
    <AnimatePresence>
      {selected&&<Modal title={`Devis — ${selected.nom}`} onClose={()=>setSelected(null)} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          <div>
            {[["Client",selected.nom],["Téléphone",selected.tel],["Email",selected.email||"—"],["Type",selected.typeEvent],["Date",selected.date],["Personnes",selected.nbPersonnes],["Statut",<StatusBadge status={selected.status}/>]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid rgba(200,135,58,0.1)`,fontSize:12}}>
                <span style={{color:C.textL,minWidth:80}}>{k}</span><span style={{fontWeight:700,color:C.text,textAlign:"right"}}>{v}</span>
              </div>
            ))}
          </div>
          <div>
            {/* Items table */}
            {(selected.items||[]).length>0&&<>
              <div style={{fontFamily:F.sans,fontWeight:700,fontSize:11,color:C.gold,marginBottom:8,letterSpacing:1,textTransform:"uppercase"}}>Détail du devis</div>
              <div style={{background:C.lcream,borderRadius:10,overflow:"hidden",marginBottom:10}}>
                {(selected.items||[]).map((it,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 10px",borderBottom:i<selected.items.length-1?`1px solid rgba(200,135,58,0.1)`:"none",fontSize:12}}>
                    <span style={{flex:1,color:C.text}}>{it.desc} <span style={{color:C.textL}}>×{it.qty}</span></span>
                    <span style={{fontWeight:700,color:C.gold}}>{fmt(it.total)}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px",background:C.green,color:C.white,fontFamily:F.serif,fontWeight:700,fontSize:16}}>
                  <span>Total</span><span style={{color:C.goldL}}>{fmt(selected.total)}</span>
                </div>
              </div>
              {selected.deposit>0&&<div style={{padding:"8px 10px",background:C.teal+"18",borderRadius:10,fontSize:12}}>
                <span style={{color:C.teal,fontWeight:700}}>Acompte : {fmt(selected.deposit)} {selected.depositPaid?"✓ Reçu":"— En attente"}</span>
              </div>}
            </>}
            {selected.notes&&<div style={{marginTop:10,padding:"8px 10px",background:C.lcream,borderRadius:10,fontSize:12,color:C.textL,fontStyle:"italic"}}>{selected.notes}</div>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {["replied","confirmed","done"].map(s=><Btn key={s} variant={selected.status===s?"primary":"ghost"} small onClick={()=>{updateStatus(selected.id,s);setSelected(q=>({...q,status:s}));}}>
            {{"replied":"💬 Marquer répondu","confirmed":"✅ Confirmer","done":"🏆 Réalisé"}[s]}
          </Btn>)}
          <Btn variant="danger" small onClick={()=>{updateStatus(selected.id,"cancelled");setSelected(null);}}>❌ Annuler</Btn>
          <a href={`https://wa.me/212${selected.tel.replace(/^0/,"")}`} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
            <Btn variant="ghost" small>📱 Contacter</Btn>
          </a>
        </div>
      </Modal>}
    </AnimatePresence>
    <AnimatePresence>{toast&&<Toast msg={toast} onClose={()=>setToast("")}/>}</AnimatePresence>
  </div>;
}

// ═══════════════════════════════════════
//   ADMIN — MENUS
// ═══════════════════════════════════════
function AdminMenus({data,setData}){
  const [adding,setAdding]=useState(false);
  const [nm,setNm]=useState({month:6,year:2025,weeks:Array(4).fill(null).map(()=>({lundi:"",mardi:"",mercredi:"",jeudi:""}))});
  const upd=(wi,d,v)=>setNm(m=>({...m,weeks:m.weeks.map((w,i)=>i===wi?{...w,[d]:v}:w)}));
  const save=()=>{
    const tmp=`tmp_${Date.now()}`;
    const newM={...nm,id:tmp,label:`${MONTHS[nm.month-1]} ${nm.year}`};
    setData(d=>({...d,monthMenus:[...d.monthMenus,newM]}));
    supabase.from('month_menus').insert({month:nm.month,year:nm.year,label:newM.label,weeks:nm.weeks}).select().single().then(({data:row})=>{
      if(row)setData(d=>({...d,monthMenus:d.monthMenus.map(m=>m.id===tmp?{...m,id:row.id}:m)}));
    });
    setAdding(false);
  };
  const deleteMenu=id=>{
    setData(d=>({...d,monthMenus:d.monthMenus.filter(m=>m.id!==id)}));
    supabase.from('month_menus').delete().eq('id',id);
  };

  return <div>
    <STitle icon="🍽️" label="Planification" title="Menus du mois"
      action={<Btn variant="gold" onClick={()=>setAdding(!adding)}>+ Créer un menu</Btn>}/>
    {adding&&<Card style={{marginBottom:"1.5rem",border:`2px solid ${C.gold}`}}>
      <div style={{fontFamily:F.serif,fontSize:16,color:C.green,marginBottom:14}}>Nouveau planning de menus</div>
      <div style={{display:"flex",gap:12,marginBottom:12}}>
        <div style={{flex:1}}><Inp label="Mois" type="select" value={nm.month} onChange={v=>setNm(m=>({...m,month:Number(v)}))} options={MONTHS.map((mo,i)=>({id:i+1,label:mo}))}/></div>
        <div style={{flex:1}}><Inp label="Année" type="select" value={nm.year} onChange={v=>setNm(m=>({...m,year:Number(v)}))} options={[{id:2025,label:"2025"},{id:2026,label:"2026"}]}/></div>
      </div>
      {nm.weeks.map((w,wi)=>(
        <div key={wi} style={{marginBottom:12}}>
          <div style={{fontFamily:F.sans,fontWeight:700,fontSize:10,color:C.gold,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Semaine {wi+1}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {DAYS.map(d=><Inp key={d} label={d.charAt(0).toUpperCase()+d.slice(1)} value={w[d]} onChange={v=>upd(wi,d,v)} placeholder="Plat du jour"/>)}
          </div>
        </div>
      ))}
      <div style={{display:"flex",gap:10}}><Btn onClick={save}>💾 Enregistrer</Btn><Btn variant="ghost" onClick={()=>setAdding(false)}>Annuler</Btn></div>
    </Card>}
    {data.monthMenus.map(m=>(
      <Card key={m.id} style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontFamily:F.serif,fontSize:17,color:C.green}}>📅 {m.label}</div>
          <Btn small variant="danger" onClick={()=>deleteMenu(m.id)}>🗑 Supprimer</Btn>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:C.green}}>
              <th style={{padding:"8px 12px",color:C.white,fontWeight:700,textAlign:"left"}}>Semaine</th>
              {DAYS.map(d=><th key={d} style={{padding:"8px 12px",color:C.white,fontWeight:700,textAlign:"left"}}>{d.charAt(0).toUpperCase()+d.slice(1)}</th>)}
            </tr></thead>
            <tbody>{m.weeks.map((w,i)=>(
              <tr key={i} style={{background:i%2===0?C.lcream:C.white}}>
                <td style={{padding:"8px 12px",fontWeight:700,color:C.textL,fontSize:11}}>Sem.{i+1}</td>
                {DAYS.map(d=><td key={d} style={{padding:"8px 12px",color:w[d]==="Vacances"?C.orange:C.text,fontStyle:w[d]==="Vacances"?"italic":"normal"}}>{w[d]==="Vacances"?"🏖️ Vacances":w[d]||"—"}</td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
    ))}
  </div>;
}

// ═══════════════════════════════════════
//   ADMIN — CLIENTS
// ═══════════════════════════════════════
function AdminClients({data,setData}){
  const [search,setSearch]=useState("");
  const filtered=data.enrollments.filter(e=>!search||`${e.parentPrenom} ${e.parentNom} ${e.tel} ${e.email}`.toLowerCase().includes(search.toLowerCase()));
  const totalChildren=data.enrollments.reduce((s,e)=>s+e.children.length,0);
  const totalRevenue=data.enrollments.filter(e=>e.payStatus==="paid").reduce((s,e)=>s+(e.amount||0),0);

  const exportExcel=()=>{
    const rows=data.enrollments.map(e=>({
      'Nom':e.parentNom,'Prénom':e.parentPrenom,'Email':e.email,'Téléphone':e.tel,
      'École':SCHOOLS.find(s=>s.id===e.school)?.label||e.school,
      'Formule':FORMULES.find(f=>f.id===e.formule)?.label||e.formule,
      'Nb enfants':e.children.length,
      'Total (DH)':e.amount||0,
      'Statut paiement':e.payStatus==='paid'?'Payé':'En attente',
      'Date inscription':e.createdAt,
    }));
    const ws=XLSX.utils.json_to_sheet(rows);
    ws['!cols']=[{wch:14},{wch:14},{wch:26},{wch:14},{wch:22},{wch:18},{wch:10},{wch:10},{wch:16},{wch:14}];
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,'Clients');
    XLSX.writeFile(wb,`Clients_JustKoul_${todayStr()}.xlsx`);
  };

  return <div>
    <STitle icon="👨‍👩‍👧" label="Base clients" title="Clients & Familles"
      action={<div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher famille, tél, email..." style={{padding:"8px 14px",fontFamily:F.sans,fontSize:12,border:`1.5px solid rgba(200,135,58,0.3)`,borderRadius:12,outline:"none",width:230}}/>
        <Btn small variant="ghost" onClick={exportExcel}>📊 Exporter Excel</Btn>
      </div>}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:"1.2rem"}}>
      <KpiCard icon="👨‍👩‍👧" label="Familles inscrites" value={data.enrollments.length} color={C.green}/>
      <KpiCard icon="🧒" label="Enfants total" value={totalChildren} color={C.blue}/>
      <KpiCard icon="✅" label="Abonnements actifs" value={data.enrollments.filter(e=>e.status==="validated").length} color={"#16A34A"}/>
      <KpiCard icon="💰" label="CA clients cantine" value={fmt(totalRevenue)} color={C.gold}/>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {filtered.map(e=>{
        const price=calcPrice(e.formule,e.repasType,e.children.length,e.school);
        const myOrders=data.orders.filter(o=>o.enrollId===e.id);
        const delivered=myOrders.filter(o=>o.delivered).length;
        return <Card key={e.id}>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:16}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},${C.green})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.serif,fontWeight:700,fontSize:16,color:C.white}}>{e.parentPrenom[0]}</div>
                <div>
                  <div style={{fontFamily:F.serif,fontWeight:700,fontSize:15,color:C.green}}>{e.parentPrenom} {e.parentNom}</div>
                  <div style={{fontSize:11,color:C.textL}}>📱 {e.tel} · ✉️ {e.email}</div>
                </div>
                <StatusBadge status={e.status}/>
                <StatusBadge status={e.payStatus}/>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:12,color:C.textL}}>
                <span>🏫 {SCHOOLS.find(s=>s.id===e.school)?.label}</span>
                <span>👧 {e.children.map(c=>`${c.prenom} (${c.classe})`).join(", ")}</span>
                <span>📋 {FORMULES.find(f=>f.id===e.formule)?.label}</span>
              </div>
              <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                <Badge label={`Total: ${fmt(price.total)}`} color={C.gold}/>
                <Badge label={`${delivered}/${myOrders.length} repas livrés`} color={C.teal}/>
                {e.children.length>=2&&<Badge label={`Réduction fratrie ${Math.round(getSiblingDiscount(e.children.length)*100)}%`} color={"#16A34A"}/>}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
              <div style={{fontFamily:F.serif,fontWeight:700,fontSize:20,color:e.payStatus==="paid"?"#16A34A":C.orange}}>{fmt(price.total)}</div>
              <div style={{fontSize:10,color:C.textL}}>Inscrit le {e.createdAt}</div>
            </div>
          </div>
        </Card>;
      })}
    </div>
  </div>;
}

// ═══════════════════════════════════════
//   ADMIN — GALERIE + AVIS
// ═══════════════════════════════════════
function AdminGalerie({data,setData}){
  const [label,setLabel]=useState("");
  const [uploading,setUploading]=useState(false);
  const [uploadErr,setUploadErr]=useState("");
  const [saved,setSaved]=useState(false);
  const fileRef=useRef();

  const reloadGallery=()=>supabase.from('gallery').select('*').order('date',{ascending:false}).then(({data:rows,error})=>{
    if(rows)setData(d=>({...d,gallery:rows.map(tG)}));
  });

  const upload=async(file)=>{
    if(!file)return;
    setUploading(true);setUploadErr("");
    const ext=file.name.split('.').pop().toLowerCase();
    const path=`${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const {error:upErr}=await supabase.storage.from('gallery').upload(path,file,{upsert:false});
    if(upErr){setUploading(false);setUploadErr('Erreur Storage : '+upErr.message);return;}
    const {data:urlData}=supabase.storage.from('gallery').getPublicUrl(path);
    const publicUrl=urlData?.publicUrl||'';
    const lbl=label.trim()||file.name;
    const {data:row,error:dbErr}=await supabase.from('gallery').insert({url:publicUrl,label:lbl,date:todayStr()}).select().single();
    if(dbErr){setUploading(false);setUploadErr('Erreur DB : '+dbErr.message);return;}
    await reloadGallery();
    setLabel("");setUploading(false);setSaved(true);setTimeout(()=>setSaved(false),2000);
    if(fileRef.current)fileRef.current.value="";
  };

  const remove=async(id)=>{
    setData(d=>({...d,gallery:d.gallery.filter(x=>x.id!==id)}));
    await supabase.from('gallery').delete().eq('id',id);
    await reloadGallery();
  };

  return <div>
    <STitle icon="🖼️" label="Contenu" title="Galerie photos"
      action={<AnimatePresence>{saved&&<motion.div key="sv" initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} exit={{opacity:0}} style={{fontFamily:F.sans,fontSize:12,fontWeight:700,color:"#16A34A",padding:"5px 12px",background:"#F0FDF4",borderRadius:12,border:"1px solid #BBF7D0"}}>✓ Photo ajoutée</motion.div>}</AnimatePresence>}/>
    <Card style={{marginBottom:"1.5rem"}}>
      <div style={{fontFamily:F.serif,fontSize:15,color:C.green,marginBottom:12}}>Ajouter une photo</div>
      <Inp label="Description (optionnel)" value={label} onChange={setLabel} placeholder="Ex: Buffet mariage Agadir — Juin 2025"/>
      {uploadErr&&<div style={{color:C.red,fontSize:12,marginBottom:10,padding:"8px 12px",background:"#FEF2F2",borderRadius:8}}>⚠ {uploadErr}</div>}
      <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",border:`2px dashed ${uploading?C.gold:"rgba(200,135,58,0.4)"}`,borderRadius:12,cursor:uploading?"not-allowed":"pointer",fontFamily:F.sans,fontSize:13,color:uploading?C.gold:C.textL,transition:"border-color 0.2s"}}>
        <span style={{fontSize:22}}>{uploading?"⏳":"📷"}</span>
        <span>{uploading?"Envoi en cours, patientez…":"Cliquer pour choisir une image (JPG, PNG, WebP)"}</span>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{display:"none"}} onChange={e=>{if(e.target.files[0])upload(e.target.files[0]);}} disabled={uploading}/>
      </label>
    </Card>
    {data.gallery.length===0
      ?<div style={{textAlign:"center",padding:"3rem",color:C.textL,fontFamily:F.sans,fontSize:13}}>Aucune photo — ajoutez-en une ci-dessus.</div>
      :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
        {data.gallery.map(g=><Card key={g.id} style={{padding:"1rem"}}>
          <div style={{height:130,background:`linear-gradient(135deg,${C.lcream},#DDD)`,borderRadius:10,marginBottom:10,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>
            {g.url
              ?<img src={g.url} alt={g.label} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={e=>{e.currentTarget.style.display="none";}}/>
              :"🍽️"}
          </div>
          <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}>{g.label||"Sans titre"}</div>
          <div style={{fontSize:11,color:C.textL,marginBottom:10}}>{g.date}</div>
          <Btn small variant="danger" onClick={()=>remove(g.id)}>🗑 Supprimer</Btn>
        </Card>)}
      </div>}
  </div>;
}
function AdminAvis({data,setData}){
  const approve=async(id)=>{
    await supabase.from('reviews').update({status:'approved'}).eq('id',id);
    const{data:rows}=await supabase.from('reviews').select('*').order('date',{ascending:false});
    if(rows)setData(d=>({...d,reviews:rows.map(tR)}));
  };
  const reject=async(id)=>{
    await supabase.from('reviews').delete().eq('id',id);
    const{data:rows}=await supabase.from('reviews').select('*').order('date',{ascending:false});
    if(rows)setData(d=>({...d,reviews:rows.map(tR)}));
  };
  const pending=data.reviews.filter(r=>r.status==="pending");
  const approved=data.reviews.filter(r=>r.status==="approved");
  return <div>
    <STitle icon="⭐" label="Modération" title="Validation des avis"/>
    {pending.length>0&&<><div style={{fontFamily:F.serif,fontSize:16,color:C.orange,marginBottom:10}}>⏳ En attente — {pending.length} avis</div>
      {pending.map(r=><Card key={r.id} style={{marginBottom:10,borderLeft:`4px solid ${C.orange}`}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{fontWeight:700,color:C.green}}>{r.parentNom}</div><Stars rating={r.rating}/></div>
        <div style={{fontSize:13,color:C.textL,fontStyle:"italic",marginBottom:10}}>"{r.text}"</div>
        <div style={{display:"flex",gap:8}}><Btn small onClick={()=>approve(r.id)}>✓ Publier</Btn><Btn small variant="danger" onClick={()=>reject(r.id)}>✕ Rejeter</Btn></div>
      </Card>)}</>}
    <div style={{fontFamily:F.serif,fontSize:16,color:C.green,margin:"1.5rem 0 10px"}}>✅ Publiés — {approved.length}</div>
    {approved.map(r=><Card key={r.id} style={{marginBottom:10,borderLeft:`4px solid #16A34A`}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><div style={{fontWeight:700,color:C.green}}>{r.parentNom}</div><Stars rating={r.rating}/></div>
      <div style={{fontSize:13,color:C.textL,fontStyle:"italic"}}>"{r.text}"</div>
    </Card>)}
  </div>;
}
function AdminPaiements({data,setData}){
  const [toast,setToast]=useState("");
  const upd=async(id,payStatus)=>{
    setData(d=>({...d,enrollments:d.enrollments.map(e=>e.id===id?{...e,payStatus}:e)}));
    await supabase.from('enrollments').update({pay_status:payStatus}).eq('id',id);
    if(payStatus==='paid'){
      const enroll=data.enrollments.find(e=>e.id===id);
      if(!enroll)return;
      const{data:existing}=await supabase.from('invoices').select('id').eq('enroll_id',id).maybeSingle();
      if(!existing){
        const gross=(enroll.amount||0)+(enroll.discount||0);
        const items=[
          {desc:`Forfait ${FORMULES.find(f=>f.id===enroll.formule)?.label||enroll.formule} Cantine - ${enroll.children.length} enfant(s)`,qty:1,unit:gross,total:gross},
          ...(enroll.discount>0?[{desc:"Réduction fratrie",qty:1,unit:-(enroll.discount),total:-(enroll.discount)}]:[])
        ];
        const inv={enroll_id:enroll.id,type:'cantine',client_nom:`${enroll.parentPrenom} ${enroll.parentNom}`,client_tel:enroll.tel,issue_date:todayStr(),due_date:todayStr(),paid_date:todayStr(),status:'paid',items,subtotal:gross,discount:enroll.discount||0,total:enroll.amount||0,deposit:0,deposit_paid:false,notes:''};
        const{data:newRow}=await supabase.from('invoices').insert(inv).select().single();
        if(newRow){
          setData(d=>({...d,invoices:[tI(newRow),...d.invoices]}));setToast("✅ Facture générée automatiquement");
          const fmtLabel=FORMULES.find(f=>f.id===enroll.formule)?.label||enroll.formule||"";
          await sendWhatsApp(`💳 *Just Koul — Paiement reçu*\n👤 ${enroll.parentPrenom} ${enroll.parentNom}\n💰 ${enroll.amount} DH\n📋 ${fmtLabel}\n✅ Facture générée automatiquement`);
        }
      }
    }
  };
  return <div>
    <STitle icon="💳" label="Finance" title="Statut des paiements"/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:"1.2rem"}}>
      <KpiCard icon="✅" label="Payés" value={data.enrollments.filter(e=>e.payStatus==="paid").length} color={"#16A34A"}/>
      <KpiCard icon="⏳" label="En attente" value={data.enrollments.filter(e=>e.payStatus!=="paid").length} color={C.orange}/>
      <KpiCard icon="💰" label="Total encaissé" value={fmt(data.enrollments.filter(e=>e.payStatus==="paid").reduce((s,e)=>s+(e.amount||0),0))} color={C.green}/>
    </div>
    <Card style={{padding:0,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <THead cols={["Famille","Formule","Montant","Méthode","Statut","Action"]}/>
          <tbody>{data.enrollments.map((e,i)=>{const price=calcPrice(e.formule,e.repasType,e.children.length,e.school);return(
            <TRow key={e.id} even={i%2===0} cells={[
              <span style={{fontWeight:700,color:C.green}}>{e.parentPrenom} {e.parentNom}</span>,
              <span style={{fontSize:12}}>{FORMULES.find(f=>f.id===e.formule)?.label}</span>,
              <span style={{fontWeight:700,color:C.gold}}>{fmt(price.total)}</span>,
              <span style={{fontSize:12,color:C.textL}}>{e.payMethod||"—"}</span>,
              <StatusBadge status={e.payStatus||"pending"}/>,
            ]}
            actions={e.payStatus!=="paid"?<Btn small onClick={()=>upd(e.id,"paid")}>✓ Payé</Btn>:<Btn small variant="ghost" onClick={()=>upd(e.id,"pending")}>Annuler</Btn>}/>
          );})}
          </tbody>
        </table>
      </div>
    </Card>
    <AnimatePresence>{toast&&<Toast msg={toast} onClose={()=>setToast("")}/>}</AnimatePresence>
  </div>;
}

// ═══════════════════════════════════════
//   ADMIN SPACE ROUTER
// ═══════════════════════════════════════
function AdminSpace({data,setData,onLogout}){
  const [tab,setTab]=useState("dashboard");
  const tabs=[
    {id:"dashboard",icon:"📊",label:"Tableau de bord"},
    {id:"commandes",icon:"📋",label:"Commandes"},
    {id:"clients",icon:"👨‍👩‍👧",label:"Clients"},
    {id:"factures",icon:"🧾",label:"Factures"},
    {id:"paiements",icon:"💳",label:"Paiements"},
    {id:"stocks",icon:"📦",label:"Stocks"},
    {id:"equipe",icon:"👥",label:"Équipe"},
    {id:"devis",icon:"🎊",label:"Devis événements"},
    {id:"menus",icon:"🍽️",label:"Menus"},
    {id:"galerie",icon:"🖼️",label:"Galerie"},
    {id:"avis",icon:"⭐",label:"Avis"},
  ];
  const badges={
    commandes:data.enrollments.filter(e=>e.status==="pending").length,
    avis:data.reviews.filter(r=>r.status==="pending").length,
    devis:data.quotes.filter(q=>q.status==="new").length,
    stocks:data.stock.filter(s=>s.qty<=s.minQty).length,
    factures:data.invoices.filter(i=>i.status==="pending"||i.status==="partial").length,
  };
  return <DashLayout color={C.sidebar} title="Just Koul" subtitle="⚙️ Administration" tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout} badges={badges}>
    {tab==="dashboard"&&<AdminDashboard data={data}/>}
    {tab==="commandes"&&<AdminCommandes data={data} setData={setData}/>}
    {tab==="clients"&&<AdminClients data={data} setData={setData}/>}
    {tab==="factures"&&<AdminFactures data={data} setData={setData}/>}
    {tab==="paiements"&&<AdminPaiements data={data} setData={setData}/>}
    {tab==="stocks"&&<AdminStocks data={data} setData={setData}/>}
    {tab==="equipe"&&<AdminEquipe data={data} setData={setData}/>}
    {tab==="devis"&&<AdminDevis data={data} setData={setData}/>}
    {tab==="menus"&&<AdminMenus data={data} setData={setData}/>}
    {tab==="galerie"&&<AdminGalerie data={data} setData={setData}/>}
    {tab==="avis"&&<AdminAvis data={data} setData={setData}/>}
  </DashLayout>;
}

// ═══════════════════════════════════════
//   PARENT SPACE
// ═══════════════════════════════════════
function ParentSpace({data,setData,onLogout}){
  const [tab,setTab]=useState("dashboard");
  const enroll=data.enrollments[0];
  if(!enroll) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:16,fontFamily:F.sans,background:C.cream}}>
    <div style={{fontSize:48}}>🍱</div>
    <div style={{fontFamily:F.serif,fontSize:20,color:C.green}}>Bienvenue !</div>
    <div style={{fontFamily:F.sans,fontSize:13,color:C.textL,textAlign:"center",maxWidth:320}}>Votre compte est bien créé. Dès que l'équipe Just Koul valide votre inscription, vos données apparaîtront ici.</div>
    <div style={{fontFamily:F.sans,fontSize:13,color:C.textL}}>WhatsApp : <strong style={{color:C.green}}>06 33 95 87 60</strong></div>
    <button onClick={onLogout} style={{marginTop:8,background:C.green,color:"#fff",border:"none",borderRadius:20,padding:"10px 24px",fontFamily:F.sans,fontWeight:700,fontSize:13,cursor:"pointer"}}>← Retour au site</button>
  </div>;
  const myOrders=data.orders.filter(o=>o.enrollId===enroll.id);
  const price=calcPrice(enroll.formule,enroll.repasType,enroll.children.length,enroll.school);
  const tabs=[{id:"dashboard",icon:"🏠",label:"Accueil"},{id:"inscription",icon:"📝",label:"Mon compte"},{id:"menus",icon:"🍽️",label:"Menus"},{id:"commandes",icon:"📦",label:"Mes commandes"},{id:"paiement",icon:"💳",label:"Paiement"},{id:"avis",icon:"⭐",label:"Mon avis"}];

  return <DashLayout color={C.green} title="Just Koul" subtitle="👨‍👩‍👧‍👦 Espace Parents" tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout}>
    {tab==="dashboard"&&<div>
      <div style={{fontFamily:F.serif,fontSize:"clamp(1.4rem,2.5vw,1.9rem)",color:C.green,marginBottom:16}}>Bonjour, {enroll.parentPrenom} ! 👋</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:"1.5rem"}}>
        <KpiCard icon="👧" label="Enfants" value={enroll.children.length} color={C.green}/>
        <KpiCard icon="🍱" label="Repas livrés" value={myOrders.filter(o=>o.delivered).length} color={C.gold}/>
        <KpiCard icon="🗓️" label="Restants" value={32-myOrders.filter(o=>o.delivered).length} color={C.greenL}/>
        <KpiCard icon="💳" label="Statut" value={enroll.payStatus==="paid"?"Payé ✓":"En attente"} color={enroll.payStatus==="paid"?"#16A34A":C.orange}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card>
          <div style={{fontFamily:F.serif,fontSize:15,color:C.green,marginBottom:10}}>📋 Ma formule</div>
          <div style={{fontSize:12,color:C.textL,lineHeight:2}}>
            <div><strong>École :</strong> {SCHOOLS.find(s=>s.id===enroll.school)?.label}</div>
            <div><strong>Formule :</strong> {FORMULES.find(f=>f.id===enroll.formule)?.label}</div>
            <div><strong>Enfants :</strong> {enroll.children.map(c=>`${c.prenom} (${c.classe})`).join(", ")}</div>
            <div><strong>Total :</strong> <span style={{color:C.gold,fontWeight:700}}>{fmt(price.total)}</span></div>
          </div>
        </Card>
        <Card>
          <div style={{fontFamily:F.serif,fontSize:15,color:C.green,marginBottom:10}}>🚀 Actions rapides</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <Btn small variant="gold" onClick={()=>setTab("menus")}>🍽️ Voir les menus du mois</Btn>
            <Btn small variant="outline" onClick={()=>setTab("commandes")}>📦 Mes commandes</Btn>
            <Btn small variant="ghost" onClick={()=>setTab("paiement")}>💳 Paiement & Facture</Btn>
            <Btn small variant="ghost" onClick={()=>setTab("avis")}>⭐ Donner mon avis</Btn>
          </div>
        </Card>
      </div>
    </div>}
    {tab==="inscription"&&<div>
      <STitle icon="📝" label="Mon compte" title="Fiche d'inscription"/>
      <Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[["Prénom",enroll.parentPrenom],["Nom",enroll.parentNom],["Téléphone",enroll.tel],["Email",enroll.email],["École",SCHOOLS.find(s=>s.id===enroll.school)?.label],["Formule",FORMULES.find(f=>f.id===enroll.formule)?.label]].map(([k,v])=>(
            <div key={k} style={{padding:"10px 12px",background:C.lcream,borderRadius:10}}>
              <div style={{fontFamily:F.sans,fontSize:10,fontWeight:800,color:C.gold,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{k}</div>
              <div style={{fontFamily:F.sans,fontSize:13,fontWeight:600,color:C.text}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:14}}>
          <div style={{fontFamily:F.sans,fontSize:10,fontWeight:800,color:C.gold,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Enfants inscrits</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {enroll.children.map((c,i)=>(
              <div key={i} style={{padding:"10px 14px",background:C.lcream,borderRadius:12,border:`1px solid rgba(200,135,58,0.2)`}}>
                <div style={{fontWeight:700,fontSize:13,color:C.green}}>{c.prenom} {c.nom}</div>
                <div style={{fontSize:11,color:C.textL}}>{c.classe}</div>
              </div>
            ))}
          </div>
        </div>
        <p style={{fontFamily:F.sans,fontSize:12,color:C.textL,marginTop:14,fontStyle:"italic"}}>Pour modifier vos informations, contactez-nous sur WhatsApp au 06 33 95 87 60.</p>
      </Card>
    </div>}
    {tab==="menus"&&<div>
      <STitle icon="🍽️" label="Planning" title="Menus du mois"/>
      {data.monthMenus.map(m=><Card key={m.id} style={{marginBottom:14}}>
        <div style={{fontFamily:F.serif,fontSize:16,color:C.green,marginBottom:10}}>📅 {m.label}</div>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:C.green}}><th style={{padding:"8px 12px",color:C.white,fontWeight:700,textAlign:"left"}}>Sem.</th>{DAYS.map(d=><th key={d} style={{padding:"8px 12px",color:C.white,fontWeight:700,textAlign:"left"}}>{d.charAt(0).toUpperCase()+d.slice(1)}</th>)}</tr></thead>
          <tbody>{m.weeks.map((w,i)=><tr key={i} style={{background:i%2===0?C.lcream:C.white}}><td style={{padding:"8px 12px",fontWeight:700,color:C.textL,fontSize:11}}>{i+1}</td>{DAYS.map(d=><td key={d} style={{padding:"8px 12px",color:w[d]==="Vacances"?C.orange:C.text,fontStyle:w[d]==="Vacances"?"italic":"normal"}}>{w[d]==="Vacances"?"🏖️ Vacances":w[d]||"—"}</td>)}</tr>)}</tbody>
        </table></div>
      </Card>)}
    </div>}
    {tab==="commandes"&&<div>
      <STitle icon="📦" label="Suivi" title="Historique commandes"/>
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <THead cols={["Enfant","Menu","Date","Livraison","Note"]}/>
            <tbody>{[...myOrders].sort((a,b)=>b.date.localeCompare(a.date)).map((o,i)=>(
              <TRow key={o.id} even={i%2===0} cells={[
                <span style={{fontWeight:700,color:C.green}}>{o.childName}</span>,
                <span style={{fontSize:12}}>{o.menu}</span>,
                <span style={{fontSize:12,color:C.textL}}>{o.date}</span>,
                o.delivered?<span style={{color:"#16A34A",fontWeight:700}}>✅ {o.deliveredAt}</span>:<span style={{color:C.orange}}>⏳ En attente</span>,
                <span style={{fontSize:11,color:C.textL,fontStyle:"italic"}}>{o.note||"—"}</span>,
              ]}/>
            ))}</tbody>
          </table>
        </div>
      </Card>
    </div>}
    {tab==="paiement"&&<div>
      <STitle icon="💳" label="Paiement" title="Facture & Règlement"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card>
          <div style={{fontFamily:F.serif,fontSize:15,color:C.green,marginBottom:12}}>🧾 Ma facture</div>
          <div style={{fontSize:13,lineHeight:2.2,color:C.textL}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><span>Base ({enroll.children.length} enfant{enroll.children.length>1?"s":""})</span><span style={{color:C.text}}>{fmt(price.base)}</span></div>
            {price.discPct>0&&<div style={{display:"flex",justifyContent:"space-between",color:"#16A34A"}}><span>Réduction fratrie ({Math.round(price.discPct*100)}%)</span><span>−{fmt(price.disc)}</span></div>}
            <div style={{display:"flex",justifyContent:"space-between",borderTop:`2px solid ${C.gold}`,paddingTop:8,marginTop:4,fontFamily:F.serif,fontWeight:700,fontSize:17}}>
              <span>Total</span><span style={{color:C.gold}}>{fmt(price.total)}</span>
            </div>
          </div>
          <div style={{marginTop:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <StatusBadge status={enroll.payStatus==="paid"?"paid":"pending"}/>
            {enroll.invoiceValidated&&<Badge label="Facture validée ✓" color="#16A34A"/>}
          </div>
        </Card>
        <Card>
          <div style={{fontFamily:F.serif,fontSize:15,color:C.green,marginBottom:12}}>💰 Méthode de paiement</div>
          {enroll.payStatus==="paid"?<div style={{textAlign:"center",padding:"1.5rem"}}>
            <div style={{fontSize:48,marginBottom:10}}>✅</div>
            <div style={{fontFamily:F.serif,fontSize:17,color:"#16A34A"}}>Paiement effectué !</div>
            <div style={{fontSize:12,color:C.textL,marginTop:8}}>Merci pour votre confiance !</div>
          </div>:<div style={{fontSize:13,color:C.textL,lineHeight:1.8}}>
            <div style={{padding:"10px 12px",background:C.lcream,borderRadius:10,marginBottom:8}}><strong>🏦 Virement bancaire</strong><br/>CIH Bank · Ref: {enroll.id}<br/>Rib disponible sur demande</div>
            <div style={{padding:"10px 12px",background:C.lcream,borderRadius:10}}><strong>💵 Espèces / Liquide</strong><br/>À remettre au livreur ou en centre</div>
            <div style={{marginTop:12,fontSize:12,fontFamily:F.sans,color:C.textL}}>Pour confirmer votre paiement, envoyez un message sur WhatsApp au <strong style={{color:C.green}}>06 33 95 87 60</strong></div>
          </div>}
        </Card>
      </div>
    </div>}
    {tab==="avis"&&<div>
      <STitle icon="⭐" label="Avis" title="Donnez votre avis"/>
      <AvisParent enroll={enroll} reviews={data.reviews} data={data} setData={setData}/>
    </div>}
  </DashLayout>;
}
function AvisParent({enroll,reviews,data,setData}){
  const myReview=reviews.find(r=>r.enrollId===enroll.id);
  const [rating,setRating]=useState(myReview?.rating||0);
  const [text,setText]=useState(myReview?.text||"");
  const [sent,setSent]=useState(!!myReview);
  const submit=()=>{
    if(!rating||!text.trim())return;
    const tmp=`tmp_${Date.now()}`;
    const nr={id:tmp,enrollId:enroll.id,parentNom:`${enroll.parentPrenom} ${enroll.parentNom[0]}.`,rating,text,status:"pending",date:todayStr()};
    setData(d=>({...d,reviews:[...d.reviews.filter(r=>r.enrollId!==enroll.id),nr]}));
    supabase.from('reviews').insert(fR(nr)).select().single().then(({data:row})=>{
      if(row)setData(d=>({...d,reviews:d.reviews.map(r=>r.id===tmp?{...r,id:row.id}:r)}));
    });
    setSent(true);
  };
  const approved=reviews.filter(r=>r.status==="approved");
  return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
    <Card>{sent?<div style={{textAlign:"center",padding:"2rem"}}><div style={{fontSize:48,marginBottom:10}}>🙏</div><div style={{fontFamily:F.serif,fontSize:17,color:C.green,marginBottom:6}}>Merci !</div><div style={{fontSize:12,color:C.textL}}>Votre avis sera publié après validation.</div></div>:(
      <><div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:C.green,marginBottom:8}}>Note globale</div><Stars rating={rating} onChange={setRating}/></div><Inp label="Votre commentaire" type="textarea" value={text} onChange={setText} placeholder="Partagez votre expérience..."/><Btn onClick={submit} variant="gold" full>Envoyer mon avis →</Btn></>
    )}</Card>
    <div><div style={{fontFamily:F.serif,fontSize:15,color:C.green,marginBottom:10}}>Avis publiés</div>
      {approved.map(r=><Card key={r.id} style={{marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><div style={{fontWeight:700,fontSize:12,color:C.green}}>{r.parentNom}</div><Stars rating={r.rating}/></div>
        <div style={{fontSize:12,color:C.textL,fontStyle:"italic"}}>"{r.text}"</div>
      </Card>)}
    </div>
  </div>;
}

// ═══════════════════════════════════════
//   LIVREUR SPACE
// ═══════════════════════════════════════
function LivreurSpace({data,setData,onLogout}){
  const [note,setNote]=useState({});const [notif,setNotif]=useState(null);
  const pending=data.orders.filter(o=>!o.delivered);
  const done=data.orders.filter(o=>o.delivered);

  const printTournee=()=>{
    const today=todayStr();
    const todayOrders=[...pending,...done].filter(o=>!o.date||o.date===today||o.date==="");
    const allOrders=todayOrders.length>0?todayOrders:[...pending,...done];
    const rows=allOrders.map((o,i)=>{
      const enroll=data.enrollments.find(e=>e.id===o.enrollId);
      const school=SCHOOLS.find(s=>s.id===enroll?.school);
      const child=enroll?.children?.find(c=>`${c.prenom} ${enroll.parentNom}`===o.childName)||enroll?.children?.[0];
      return `<tr>
        <td>${i+1}</td>
        <td><strong>${o.childName||"-"}</strong></td>
        <td>${school?.label||enroll?.school||"-"}</td>
        <td>${child?.classe||"-"}</td>
        <td>${o.menu||"-"}</td>
        <td>${o.delivered?o.deliveredAt:"___:___"}</td>
        <td style="width:80px"></td>
      </tr>`;
    }).join("");
    const win=window.open("","_blank","width=900,height=700");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Tournée Just Koul — ${today}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#222;}
      h1{font-size:20px;color:#2C4A1E;margin:0 0 2px;}
      .subtitle{font-size:11px;color:#888;margin-bottom:16px;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;border-bottom:2px solid #C8873A;padding-bottom:10px;}
      .logo{font-size:22px;font-weight:bold;color:#2C4A1E;letter-spacing:-0.5px;}
      .logo span{color:#C8873A;}
      table{width:100%;border-collapse:collapse;margin-top:8px;}
      th{background:#2C4A1E;color:white;padding:8px 6px;text-align:left;font-size:11px;}
      td{border:1px solid #ccc;padding:8px 6px;vertical-align:middle;}
      tr:nth-child(even) td{background:#FAF4E4;}
      .footer{margin-top:16px;text-align:center;font-size:10px;color:#888;border-top:1px solid #ddd;padding-top:8px;}
      @media print{
        .no-print{display:none!important;}
        body{margin:10px;}
        h1{font-size:16px;}
      }
    </style></head><body>
    <div class="header">
      <div>
        <div class="logo">JUST <span>KOUL</span></div>
        <p style="margin:2px 0;font-size:10px;color:#888;">Eat · Enjoy · Repeat — Agadir, Maroc</p>
      </div>
      <div style="text-align:right">
        <div style="font-size:13px;font-weight:bold;color:#2C4A1E;">BON DE LIVRAISON</div>
        <div style="font-size:11px;color:#555;">${today}</div>
      </div>
    </div>
    <h1>Tournée du ${today}</h1>
    <p class="subtitle">${allOrders.length} livraison${allOrders.length!==1?"s":""}  au total — À compléter par le livreur</p>
    <table>
      <thead><tr>
        <th style="width:30px">N°</th>
        <th>Enfant</th><th>École</th><th>Classe</th><th>Menu</th><th>Heure</th>
        <th style="width:90px">Signature</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      Total livraisons : ${allOrders.length} · Just Koul · 06 33 95 87 60 · @just_koul
    </div>
    <br/><div class="no-print" style="text-align:center;margin-top:16px;">
      <button onclick="window.print();window.close();" style="background:#2C4A1E;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:14px;cursor:pointer;font-family:Arial;">
        🖨️ Imprimer
      </button>
    </div>
    </body></html>`);
    win.document.close();
    win.focus();
  };
  const validate=id=>{
    const time=`${new Date().getHours()}:${pad(new Date().getMinutes())}`;
    const noteVal=note[id]||"";
    setData(d=>({...d,orders:d.orders.map(o=>o.id===id?{...o,delivered:true,deliveredAt:time,note:noteVal}:o)}));
    supabase.from('orders').update({delivered:true,delivered_at:time,note:noteVal}).eq('id',id);
    const ord=data.orders.find(o=>o.id===id);
    setNotif(`✅ Livraison confirmée — ${ord?.childName} à ${time}`);
    setTimeout(()=>setNotif(null),4000);
  };
  return <div style={{minHeight:"100vh",background:C.lcream,fontFamily:F.sans}}>
    <div style={{background:C.blue,color:C.white,padding:"1rem 2rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
      <div><div style={{fontFamily:F.serif,fontSize:18,fontWeight:700}}>Just Koul · Espace Livreur</div><div style={{fontSize:11,opacity:0.75}}>🛵 {todayStr()}</div></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button onClick={printTournee} style={{background:"rgba(255,255,255,0.15)",color:C.white,border:"1px solid rgba(255,255,255,0.3)",borderRadius:10,padding:"7px 14px",cursor:"pointer",fontFamily:F.sans,fontSize:12,fontWeight:700}}>🖨️ Imprimer la tournée</button>
        <button onClick={onLogout} style={{background:"rgba(255,255,255,0.1)",color:C.white,border:"none",borderRadius:10,padding:"7px 14px",cursor:"pointer",fontFamily:F.sans,fontSize:12}}>← Retour au site</button>
      </div>
    </div>
    <AnimatePresence>
      {notif&&<motion.div initial={{y:-40,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-40,opacity:0}}
        style={{background:"#16A34A",color:C.white,padding:"12px 2rem",fontFamily:F.sans,fontWeight:700,fontSize:13,textAlign:"center"}}>{notif}</motion.div>}
    </AnimatePresence>
    <div style={{padding:"1.5rem",maxWidth:760,margin:"0 auto"}}>
      {/* Stats strip */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:"1.5rem"}}>
        <KpiCard icon="📦" label="À livrer" value={pending.length} color={C.blue}/>
        <KpiCard icon="✅" label="Livrées" value={done.length} color={"#16A34A"}/>
        <KpiCard icon="📊" label="Taux" value={`${data.orders.length>0?Math.round(done.length/data.orders.length*100):0}%`} color={C.teal}/>
      </div>
      <STitle icon="🛵" label="À livrer" title={`${pending.length} livraison${pending.length!==1?"s":""} en cours`}/>
      {pending.length===0&&<Card style={{textAlign:"center",padding:"3rem"}}><div style={{fontSize:56,marginBottom:12}}>🎉</div><div style={{fontFamily:F.serif,fontSize:18,color:C.green}}>Toutes les livraisons sont effectuées !</div></Card>}
      {pending.map(o=>{
        const enroll=data.enrollments.find(e=>e.id===o.enrollId);
        const school=SCHOOLS.find(s=>s.id===enroll?.school);
        return <motion.div key={o.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} layout>
          <Card style={{marginBottom:12,borderLeft:`4px solid ${C.blue}`,padding:"1rem 1.2rem"}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15,color:C.green,marginBottom:4}}>{o.childName}</div>
                <div style={{fontSize:12,color:C.textL,lineHeight:1.9}}>
                  <div>🍱 {o.menu}</div>
                  <div>🏫 {school?.label}{enroll?.autreEcole?` — ${enroll.autreEcole}`:""}</div>
                  <div>📱 {enroll?.parentPrenom} {enroll?.parentNom} · {enroll?.tel}</div>
                </div>
                <textarea value={note[o.id]||""} onChange={e=>setNote(n=>({...n,[o.id]:e.target.value}))}
                  placeholder="Remarque (optionnel)..."
                  style={{marginTop:10,width:"100%",padding:"7px 10px",fontFamily:F.sans,fontSize:12,border:`1.5px solid rgba(200,135,58,0.3)`,borderRadius:10,resize:"none",height:50,boxSizing:"border-box"}}/>
              </div>
              <Btn variant="gold" onClick={()=>validate(o.id)}>✅ Livré</Btn>
            </div>
          </Card>
        </motion.div>;
      })}
      {done.length>0&&<>
        <STitle icon="✅" label="Historique du jour" title="Livraisons effectuées"/>
        {done.map(o=><Card key={o.id} style={{marginBottom:10,background:"rgba(22,163,74,0.04)",borderLeft:`4px solid #16A34A`,padding:"0.8rem 1.2rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontWeight:700,fontSize:13,color:C.green}}>{o.childName}</div><div style={{fontSize:11,color:C.textL}}>{o.menu} · Livré à {o.deliveredAt}{o.note?` · "${o.note}"`:""}</div></div>
            <Badge label="✅ Livré" color="#16A34A"/>
          </div>
        </Card>)}
      </>}
    </div>
  </div>;
}

// ═══════════════════════════════════════
//   CHATBOT IA
// ═══════════════════════════════════════
const FAQ=[
  {q:["tarif","prix","cout","combien","formule","forfait"],r:`🍱 Nos tarifs cantine :\n• À la commande : 49 DH ou 56 DH (complet)\n• Forfait semaine : 176 DH ou 200 DH\n• Forfait mensuel : 688 DH ou 770 DH ⭐\n• Forfait trimestriel : 1 950 DH ou 2 200 DH\n\n👨‍👩‍👧 Réductions fratrie : -10% (2 enfants), -20% (3 enfants), -30% (4+)`},
  {q:["bonjour","salut","salam","bonsoir","hello","hi"],r:`Bonjour ! 👋 Bienvenue chez Just Koul !\nJe peux vous renseigner sur :\n💰 Nos tarifs\n🏫 Les écoles desservies\n🍽️ Les menus de la semaine\n💳 Les modes de paiement\n📝 Comment s'inscrire\n\nQue souhaitez-vous savoir ?`},
  {q:["ecole","livraison","hanane","inbihat","amal","smart","chrysalide","bel air","belair","ou"],r:`🏫 Écoles desservies :\n• École Al Hanane\n• Amal School\n• Smart School\n• La Chrysalide\n• École Al Inbihat\n• Académie Bel Air\n• Autre école : +30 DH supplément\n\n🕛 Livraison entre 11h30 et 13h00, lundi au jeudi`},
  {q:["menu","plat","manger","lundi","mardi","mercredi","jeudi","semaine","aujourd"],r:`🍽️ Menus de la semaine :\n• Lundi : Poulet rôti & riz pilaf 🍗\n• Mardi : Lasagnes maison 🍝\n• Mercredi : Filet de poisson & purée 🐟\n• Jeudi : Tajine légumes & couscous 🫕\n\nChaque repas = entrée + plat + dessert ou yaourt`},
  {q:["paiement","payer","virement","rib","espece","liquide","banque"],r:`💳 Modes de paiement :\n\n🏦 Virement bancaire :\nBanque Populaire du Maroc\nRIB : 101 810 0004800078601 34\n\n💵 Espèces : au livreur ou en centre\n\n📱 Confirmez par WhatsApp : 06 33 95 87 60`},
  {q:["allergi","halal","porc","gluten","regime","vegetar"],r:`🌿 Qualité & Allergies :\n• Tous nos plats sont 100% halal\n• Produits frais locaux, fait maison\n• Déclarez les allergies à l'inscription\n\n📱 Pour un régime spécial : 06 33 95 87 60`},
  {q:["inscri","comment","commencer","demarrer","abonner","rejoindre"],r:`✅ Comment s'inscrire :\n1. Cliquez "Mon espace" → Créer mon compte\n2. Choisissez votre formule et vos jours\n3. Notre équipe vous contacte sous 24h\n4. Payez et les livraisons démarrent !\n\n📱 Ou WhatsApp : 06 33 95 87 60`},
  {q:["horaire","heure","quand","midi","matin","livr"],r:`🕛 Horaires de livraison :\nLes repas sont livrés entre 11h30 et 13h00\nDu lundi au jeudi uniquement\n\nUn message WhatsApp vous est envoyé à chaque livraison ✅`},
  {q:["buffet","evenement","mariage","anniversaire","corporate","soiree","ftour","ramadan"],r:`🎊 Buffets & Événements :\n• Mariages & Fiançailles\n• Anniversaires\n• Corporate & Séminaires\n• Ftour Ramadan\n• Ventes privées & Cocktails\n\nDemandez votre devis gratuit !\n📱 06 33 95 87 60`},
  {q:["contact","whatsapp","telephone","joindre","instagram","appeler"],r:`📱 Nous contacter :\n• WhatsApp : 06 33 95 87 60\n• Instagram cantine : @just_koul\n• Instagram buffets : @just_koulbuffet\n\nNous répondons lun-sam de 8h à 20h 😊`},
  {q:["merci","super","parfait","nickel","genial","bien"],r:`Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions.\nÀ très bientôt chez Just Koul ! 🍱`},
];
function findFaqAnswer(input){
  const low=input.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  for(const faq of FAQ){if(faq.q.some(kw=>low.includes(kw)))return faq.r;}
  return null;
}
const FALLBACK_MSG="Je ne suis pas sûr de comprendre votre question 🤔\n\nEssayez de me demander :\n• Les tarifs\n• Les écoles desservies\n• Les menus de la semaine\n• Comment s'inscrire\n• Les modes de paiement\n\nOu contactez-nous directement :\n📱 WhatsApp : 06 33 95 87 60";

function Chatbot(){
  const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState([{role:"assistant",content:"Bonjour ! 👋 Je suis l'assistant Just Koul. Comment puis-je vous aider ? Tarifs, menus, livraisons, buffets..."}]);
  const [input,setInput]=useState("");const [loading,setLoading]=useState(false);
  const endRef=useRef();
  useEffect(()=>{if(open)endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,open]);
  const send=async()=>{
    if(!input.trim()||loading)return;
    const um={role:"user",content:input};setMsgs(m=>[...m,um]);setInput("");setLoading(true);
    const faqAnswer=findFaqAnswer(input);
    if(faqAnswer){setMsgs(m=>[...m,{role:"assistant",content:faqAnswer}]);setLoading(false);return;}
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:400,system:`Tu es l'assistant virtuel de Just Koul, traiteur à Agadir. Réponds en français, chaleureux, concis. Tarifs cantine: commande 49-56DH, semaine 176-200DH, mensuel 688-770DH, trimestriel 1950-2200DH. Écoles: Al Hanane, Amal School, Smart School, La Chrysalide, Al Inbihat, Académie Bel Air. Contact: 06 33 95 87 60.`,messages:[...msgs,um].map(m=>({role:m.role,content:m.content}))})});
      const d=await res.json();
      setMsgs(m=>[...m,{role:"assistant",content:d.content?.[0]?.text||FALLBACK_MSG}]);
    }catch{setMsgs(m=>[...m,{role:"assistant",content:FALLBACK_MSG}]);}
    setLoading(false);
  };
  return <>
    <motion.button onClick={()=>setOpen(o=>!o)} whileHover={{scale:1.1}} whileTap={{scale:0.94}} animate={{rotate:open?90:0}}
      style={{position:"fixed",bottom:24,right:24,zIndex:1000,width:54,height:54,borderRadius:"50%",background:`linear-gradient(135deg,${C.green},${C.greenL})`,color:C.white,border:"none",fontSize:22,cursor:"pointer",boxShadow:"0 8px 24px rgba(44,74,30,0.45)"}}>
      {open?"✕":"💬"}
    </motion.button>
    <AnimatePresence>
      {open&&<motion.div initial={{opacity:0,y:20,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:16,scale:0.95}} transition={{duration:0.28}}
        style={{position:"fixed",bottom:90,right:24,zIndex:999,width:330,maxHeight:480,background:C.white,borderRadius:20,boxShadow:"0 16px 60px rgba(0,0,0,0.2)",display:"flex",flexDirection:"column",fontFamily:F.sans,border:`1px solid rgba(200,135,58,0.2)`}}>
        <div style={{background:`linear-gradient(135deg,${C.green},${C.greenL})`,borderRadius:"20px 20px 0 0",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🍱</div>
          <div><div style={{fontFamily:F.serif,fontWeight:700,fontSize:14,color:C.white}}>Just Koul</div><div style={{fontSize:9,color:"rgba(255,255,255,0.7)"}}>Assistant virtuel · En ligne</div></div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px",display:"flex",flexDirection:"column",gap:8,maxHeight:300}}>
          {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"84%",padding:"8px 12px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?C.green:C.lcream,color:m.role==="user"?C.white:C.text,fontSize:12.5,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.content}</div>
          </div>)}
          {loading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{background:C.lcream,borderRadius:"16px 16px 16px 4px",padding:"8px 12px",color:C.textL,fontSize:12}}>⏳ ...</div></div>}
          <div ref={endRef}/>
        </div>
        <div style={{padding:"8px 12px",borderTop:`1px solid rgba(200,135,58,0.15)`,display:"flex",gap:7}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Posez votre question..." style={{flex:1,padding:"8px 11px",fontFamily:F.sans,fontSize:12,background:C.lcream,border:`1px solid rgba(200,135,58,0.2)`,borderRadius:16,outline:"none",color:C.text}}/>
          <button onClick={send} disabled={loading||!input.trim()} style={{width:35,height:35,borderRadius:"50%",background:C.gold,border:"none",color:C.white,fontSize:15,cursor:"pointer",flexShrink:0}}>→</button>
        </div>
      </motion.div>}
    </AnimatePresence>
  </>;
}

// ═══════════════════════════════════════
//   RESET PASSWORD PAGE  (/reset-password)
// ═══════════════════════════════════════
function ResetPasswordPage(){
  const [pwd,setPwd]=useState("");
  const [pwd2,setPwd2]=useState("");
  const [msg,setMsg]=useState("");
  const [loading,setLoading]=useState(false);
  const isErr=msg&&(msg.includes("Erreur")||msg.includes("différents")||msg.includes("court")||msg.includes("champs"));

  const doReset=async()=>{
    if(!pwd||!pwd2){setMsg("Remplissez les deux champs");return;}
    if(pwd!==pwd2){setMsg("Les mots de passe sont différents");return;}
    if(pwd.length<6){setMsg("Mot de passe trop court (min. 6 caractères)");return;}
    setLoading(true);
    const{error}=await supabase.auth.updateUser({password:pwd});
    setLoading(false);
    if(error){setMsg("Erreur : "+error.message);return;}
    setMsg("Mot de passe mis à jour ! Vous pouvez maintenant vous connecter.");
  };

  const iS={width:"100%",padding:"12px 14px",fontFamily:F.sans,fontSize:14,background:"#FAF4E4",color:C.text,border:`1.5px solid rgba(200,135,58,0.28)`,borderRadius:12,outline:"none",boxSizing:"border-box",marginBottom:16};
  const lS={fontFamily:F.sans,fontWeight:700,fontSize:11,color:C.green,display:"block",marginBottom:5,letterSpacing:0.3};

  return (
    <div style={{minHeight:"100vh",background:C.cream,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.sans,padding:"1rem"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Nunito:wght@400;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{background:C.white,borderRadius:28,padding:"2.5rem",width:"100%",maxWidth:420,boxShadow:"0 24px 80px rgba(0,0,0,0.15)"}}>
        <div style={{textAlign:"center",marginBottom:"1.8rem"}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:4}}>
            <JustKoulLogo size={44} showText={false}/>
          </div>
          <h2 style={{fontFamily:F.serif,fontSize:22,color:C.green,margin:"1rem 0 4px"}}>Nouveau mot de passe</h2>
          <p style={{fontSize:12,color:C.textL}}>Choisissez un mot de passe sécurisé</p>
        </div>
        <label style={lS}>Nouveau mot de passe <span style={{color:C.red}}>*</span></label>
        <input style={iS} type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="••••••••"/>
        <label style={lS}>Confirmer le mot de passe <span style={{color:C.red}}>*</span></label>
        <input style={{...iS,marginBottom:16}} type="password" value={pwd2} onChange={e=>setPwd2(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&doReset()}/>
        {msg&&<div style={{fontSize:12,marginBottom:14,padding:"10px 12px",background:isErr?"#FEF2F2":"#F0FDF4",borderRadius:10,color:isErr?C.red:"#16A34A"}}>{msg}</div>}
        <Btn onClick={doReset} full disabled={loading}>{loading?"En cours…":"Confirmer →"}</Btn>
        <div style={{textAlign:"center",marginTop:14}}>
          <a href="/" style={{fontSize:12,color:C.textL,textDecoration:"none"}}>← Retour à l'accueil</a>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//   ROOT APP
// ═══════════════════════════════════════
export default function App(){
  const [role,setRole]=useState(()=>localStorage.getItem('jk_role'));
  const [showLogin,setShowLogin]=useState(false);
  const [data,setData]=useState(EMPTY);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    loadAllData().then(d=>{setData(d);setLoading(false);}).catch(()=>setLoading(false));
    const channel=supabase.channel('db-changes')
      .on('postgres_changes',{event:'*',schema:'public',table:'enrollments'},()=>loadAllData().then(d=>setData(d)).catch(()=>{}))
      .on('postgres_changes',{event:'*',schema:'public',table:'orders'},()=>loadAllData().then(d=>setData(d)).catch(()=>{}))
      .subscribe();
    return ()=>supabase.removeChannel(channel);
  },[]);

  const handleLogin=r=>{setRole(r);localStorage.setItem('jk_role',r);setShowLogin(false);};
  const logout=()=>{setRole(null);localStorage.removeItem('jk_role');};

  if(window.location.pathname==="/reset-password") return <ResetPasswordPage/>;

  if(loading) return (
    <div style={{position:"fixed",inset:0,background:C.cream,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,fontFamily:F.sans}}>
      <motion.div animate={{rotate:360}} transition={{duration:1.2,repeat:Infinity,ease:"linear"}} style={{width:48,height:48,border:`4px solid rgba(44,74,30,0.12)`,borderTopColor:C.green,borderRadius:"50%"}}/>
      <div style={{fontFamily:F.serif,fontSize:18,color:C.green}}>Just Koul</div>
      <div style={{fontSize:12,color:C.textL}}>Chargement des données…</div>
    </div>
  );

  return <>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,800;1,400&family=Nunito:wght@300;400;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}body{overflow-x:hidden;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:rgba(200,135,58,0.4);border-radius:3px;}input:focus,select:focus,textarea:focus{border-color:#C8873A!important;box-shadow:0 0 0 3px rgba(200,135,58,0.1)!important;outline:none;}@media(max-width:1024px){.buffet-grid{grid-template-columns:repeat(2,1fr)!important;}.engagements-grid{grid-template-columns:repeat(2,1fr)!important;}}@media(max-width:768px){.nd{display:none!important;}.nm{display:block!important;}.hero-grid{grid-template-columns:1fr!important;min-height:auto!important;gap:1.5rem!important;padding-top:0!important;}.hero-img-wrap{min-height:auto!important;padding-bottom:1rem!important;}.hero-img-box{width:260px!important;height:260px!important;}.hero-float{display:none!important;}.hero-ctas{flex-direction:column!important;}.hero-ctas>*{width:100%!important;box-sizing:border-box!important;}.hero-stats{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important;}.form-2col{grid-template-columns:1fr!important;}.buffet-grid{grid-template-columns:1fr!important;}.engagements-grid{grid-template-columns:1fr!important;}.steps-grid{grid-template-columns:1fr!important;}.dash-sidebar{position:fixed!important;top:0!important;left:0!important;height:100vh!important;z-index:100!important;transform:translateX(-100%)!important;width:260px!important;}.dash-sidebar.open{transform:translateX(0)!important;}}`}</style>
    <AnimatePresence>
      {showLogin&&<LoginModal key="modal" onLogin={handleLogin} onClose={()=>setShowLogin(false)} data={data}/>}
    </AnimatePresence>
    <AnimatePresence mode="wait">
      {!role?(
        <motion.div key="public" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}}>
          <PublicSite onLoginClick={()=>setShowLogin(true)} data={data} setData={setData}/>
        </motion.div>
      ):role==="parent"?(
        <motion.div key="parent" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.3}}>
          <ParentSpace data={data} setData={setData} onLogout={logout}/>
        </motion.div>
      ):role==="admin"?(
        <motion.div key="admin" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.3}}>
          <AdminSpace data={data} setData={setData} onLogout={logout}/>
        </motion.div>
      ):(
        <motion.div key="livreur" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.3}}>
          <LivreurSpace data={data} setData={setData} onLogout={logout}/>
        </motion.div>
      )}
    </AnimatePresence>
    <Chatbot/>
  </>;
}
