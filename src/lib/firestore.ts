import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, where, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ProcessedTicket, HubSpotTicket } from '@/types';
import { fetchOwnerInfo, fetchTicketCategoryLabel, fetchPipelineStageLabel } from './hubspot';

const TICKETS_COLLECTION = 'support_tickets';

/**
 * Xử lý dữ liệu ticket từ HubSpot - Lưu createDate dưới dạng string
 */
export function processTicketData(ticket: any): ProcessedTicket {
  try {
    console.log('🔄 Processing ticket data:', ticket.id);
    
    const props = ticket.properties || {};
    
    // Hàm helper để lấy giá trị property
    const getPropertyValue = (prop: any): string => {
      if (!prop) return '';
      if (typeof prop === 'string') return prop;
      if (typeof prop === 'object' && prop.value !== undefined) return String(prop.value);
      return String(prop);
    };
    
    // Lấy createdate dưới dạng string nguyên bản
    const createDateValue = getPropertyValue(props.createdate);
    console.log(`📅 CreateDate từ HubSpot: "${createDateValue}"`);
    
    return {
      id: ticket.id,
      ticketId: getPropertyValue(props.hs_ticket_id) || ticket.id,
      category: getPropertyValue(props.hs_ticket_category),
      categoryLabel: getPropertyValue(props.hs_ticket_category),
      ownerId: getPropertyValue(props.hubspot_owner_id),
      ownerName: '',
      companyName: getPropertyValue(props.hs_primary_company_name),
      subject: getPropertyValue(props.subject),
      sourceType: getPropertyValue(props.source_type),
      content: getPropertyValue(props.content),
      pipelineStage: getPropertyValue(props.hs_pipeline_stage),
      pipelineStageLabel: '', // THÊM FIELD BỊ THIẾU
      supportObject: getPropertyValue(props.support_object),
      createDate: createDateValue, // LƯU DƯỚI DẠNG STRING
      syncedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error processing ticket data:', error);
    return {
      id: ticket.id || 'unknown',
      ticketId: ticket.id || 'unknown',
      category: '',
      categoryLabel: '',
      ownerId: '',
      ownerName: '',
      companyName: '',
      subject: '',
      sourceType: '',
      content: '',
      pipelineStage: '',
      pipelineStageLabel: '', // THÊM FIELD BỊ THIẾU
      supportObject: '',
      createDate: '', // Fallback về string rỗng
      syncedAt: new Date().toISOString()
    };
  }
}

/**
 * Xử lý dữ liệu ticket từ HubSpot với async operations - CẬP NHẬT
 */
export async function processTicketDataWithDetails(hubspotTicket: HubSpotTicket): Promise<ProcessedTicket> {
  try {
    const props = hubspotTicket.properties || {};
    
    // Hàm helper để lấy giá trị từ property
    const getPropertyValue = (prop: any): string => {
      if (!prop) return '';
      if (typeof prop === 'string') return prop;
      if (typeof prop === 'object' && prop.value !== undefined) return String(prop.value);
      return String(prop);
    };
    
    // Lấy createdate dưới dạng string nguyên bản
    const createDateValue = getPropertyValue(props.createdate);
    console.log(`📅 CreateDate từ HubSpot: "${createDateValue}"`);
    
    // Tạo object với dữ liệu cơ bản
    const ticket: ProcessedTicket = {
      id: String(hubspotTicket.id || Date.now()),
      ticketId: getPropertyValue(props.hs_ticket_id) || String(hubspotTicket.id || ''),
      category: getPropertyValue(props.hs_ticket_category),
      categoryLabel: '',
      ownerId: getPropertyValue(props.hubspot_owner_id),
      ownerName: '',
      companyName: getPropertyValue(props.hs_primary_company_name),
      subject: getPropertyValue(props.subject),
      sourceType: getPropertyValue(props.source_type),
      content: getPropertyValue(props.content).substring(0, 1000),
      pipelineStage: getPropertyValue(props.hs_pipeline_stage),
      pipelineStageLabel: '', // THÊM FIELD MỚI
      supportObject: getPropertyValue(props.support_object),
      createDate: createDateValue,
      syncedAt: new Date().toISOString()
    };
    
    console.log('📋 Ticket processed với createDate:', ticket.createDate);
    
    // Lấy thông tin owner nếu có
    if (ticket.ownerId && ticket.ownerId !== '') {
      try {
        console.log(`🔍 Đang lấy thông tin owner cho ID: ${ticket.ownerId}`);
        const ownerName = await fetchOwnerInfo(ticket.ownerId);
        ticket.ownerName = String(ownerName || 'Unknown');
        console.log(`👤 Owner name: ${ticket.ownerName}`);
      } catch (error) {
        console.warn('Failed to fetch owner info:', error);
        ticket.ownerName = 'Unknown';
      }
    }
    
    // Lấy pipeline stage label nếu có
    if (ticket.pipelineStage && ticket.pipelineStage !== '') {
      try {
        console.log(`🔍 Đang lấy label cho pipeline stage: ${ticket.pipelineStage}`);
        const stageLabel = await fetchPipelineStageLabel(ticket.pipelineStage);
        ticket.pipelineStageLabel = String(stageLabel || ticket.pipelineStage);
        console.log(`📊 Pipeline stage label: ${ticket.pipelineStageLabel}`);
      } catch (error) {
        console.warn('Failed to fetch pipeline stage label:', error);
        ticket.pipelineStageLabel = ticket.pipelineStage;
      }
    }
    
    // Lấy category label nếu chưa có
    if (ticket.category && ticket.category !== '' && !ticket.categoryLabel) {
      try {
        const categoryLabel = await fetchTicketCategoryLabel(ticket.category);
        ticket.categoryLabel = String(categoryLabel || ticket.category);
      } catch (error) {
        console.warn('Failed to fetch category label:', error);
        ticket.categoryLabel = ticket.category;
      }
    }
    
    return ticket;
    
  } catch (error) {
    console.error('Error processing ticket:', error);
    // Trả về ticket với dữ liệu cơ bản nếu có lỗi
    return {
      id: String(hubspotTicket.id || Date.now()),
      ticketId: String(hubspotTicket.properties?.hs_ticket_id?.value || hubspotTicket.id || ''),
      category: '',
      categoryLabel: '',
      ownerId: '',
      ownerName: '',
      companyName: '',
      subject: 'Error processing ticket',
      sourceType: '',
      content: '',
      pipelineStage: '',
      pipelineStageLabel: '', // THÊM FIELD MỚI
      supportObject: '',
      createDate: '',
      syncedAt: new Date().toISOString()
    };
  }
}

/**
 * Lưu ticket vào Firestore - CẬP NHẬT
 */
export async function saveTicketToFirestore(ticket: ProcessedTicket): Promise<void> {
  try {
    // Chuyển đổi dữ liệu sang format phù hợp với Firestore
    const firestoreData = {
      ticketId: ticket.ticketId,
      category: ticket.category,
      categoryLabel: ticket.categoryLabel,
      ownerId: ticket.ownerId,
      ownerName: ticket.ownerName,
      companyName: ticket.companyName,
      subject: ticket.subject,
      sourceType: ticket.sourceType,
      content: ticket.content,
      pipelineStage: ticket.pipelineStage,
      pipelineStageLabel: ticket.pipelineStageLabel, // THÊM FIELD MỚI
      supportObject: ticket.supportObject,
      createDate: ticket.createDate,
      syncedAt: ticket.syncedAt
    };
    
    const ticketsRef = collection(db, TICKETS_COLLECTION);
    await addDoc(ticketsRef, firestoreData);
    
  } catch (error) {
    console.error('Error saving ticket to Firestore:', error);
    throw error;
  }
}

/**
 * Cập nhật ticket trong Firestore theo ticketId
 */
export async function updateTicketInFirestore(ticketId: string, updatedData: Partial<ProcessedTicket>): Promise<void> {
  try {
    const ticketsRef = collection(db, TICKETS_COLLECTION);
    const q = query(ticketsRef, where('ticketId', '==', ticketId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error(`Ticket ${ticketId} not found in Firestore`);
    }
    
    // Cập nhật tất cả documents có ticketId này (thường chỉ có 1)
    const updatePromises = querySnapshot.docs.map(docSnapshot => {
      const docRef = doc(db, TICKETS_COLLECTION, docSnapshot.id);
      
      // Lưu dữ liệu trực tiếp, createDate giữ nguyên dạng string
      const firestoreData = {
        ...updatedData,
        // createDate giữ nguyên dạng string từ HubSpot
        createDate: updatedData.createDate,
        // syncedAt luôn là thời gian hiện tại dạng ISO string
        syncedAt: new Date().toISOString()
      };
      
      // Log để debug
      console.log(`🔄 Cập nhật ticket ${ticketId}:`, {
        createDate: firestoreData.createDate,
        syncedAt: firestoreData.syncedAt
      });
      
      return updateDoc(docRef, firestoreData);
    });
    
    await Promise.all(updatePromises);
    console.log(`✅ Đã cập nhật ${updatePromises.length} documents cho ticket ${ticketId}`);
    
  } catch (error) {
    console.error(`❌ Lỗi cập nhật ticket ${ticketId}:`, error);
    throw error;
  }
}

/**
 * Lấy tickets từ Firestore - SỬA LỖI
 */
export async function getTicketsFromFirestore(): Promise<ProcessedTicket[]> {
  try {
    const ticketsRef = collection(db, TICKETS_COLLECTION);
    const q = query(ticketsRef, orderBy('syncedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ticketId: data.ticketId || '',
        category: data.category || '',
        categoryLabel: data.categoryLabel || '',
        ownerId: data.ownerId || '',
        ownerName: data.ownerName || '',
        companyName: data.companyName || '',
        subject: data.subject || '',
        sourceType: data.sourceType || '',
        content: data.content || '',
        pipelineStage: data.pipelineStage || '',
        pipelineStageLabel: data.pipelineStageLabel || '', // THÊM FIELD BỊ THIẾU
        supportObject: data.supportObject || '',
        // createDate giữ nguyên dạng string
        createDate: data.createDate || '',
        syncedAt: data.syncedAt || ''
      };
    }) as ProcessedTicket[];
  } catch (error) {
    console.error('Error fetching tickets from Firestore:', error);
    throw error;
  }
}

/**
 * Lấy ticket từ Firestore theo ticketId - SỬA LỖI
 */
export async function getTicketFromFirestore(ticketId: string): Promise<ProcessedTicket | null> {
  try {
    const ticketsRef = collection(db, TICKETS_COLLECTION);
    const q = query(ticketsRef, where('ticketId', '==', ticketId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      ticketId: data.ticketId || '',
      category: data.category || '',
      categoryLabel: data.categoryLabel || '',
      ownerId: data.ownerId || '',
      ownerName: data.ownerName || '',
      companyName: data.companyName || '',
      subject: data.subject || '',
      sourceType: data.sourceType || '',
      content: data.content || '',
      pipelineStage: data.pipelineStage || '',
      pipelineStageLabel: data.pipelineStageLabel || '', // THÊM FIELD BỊ THIẾU
      supportObject: data.supportObject || '',
      // createDate giữ nguyên dạng string
      createDate: data.createDate || '',
      syncedAt: data.syncedAt || ''
    } as ProcessedTicket;
    
  } catch (error) {
    console.error(`Error fetching ticket ${ticketId}:`, error);
    throw error;
  }
}

/**
 * Lưu test ticket đơn giản
 */
export async function saveTestTicket(): Promise<void> {
  const testData = {
    ticketId: 'TEST-' + Date.now(),
    subject: 'Test Ticket',
    content: 'This is a test ticket',
    createDate: new Date().toISOString(),
    syncedAt: new Date().toISOString(),
    status: 'test'
  };
  
  try {
    const testRef = collection(db, 'test_tickets');
    const docRef = await addDoc(testRef, testData);
    console.log('Test ticket saved with ID:', docRef.id);
  } catch (error) {
    console.error('Error saving test ticket:', error);
    throw error;
  }
}

/**
 * Lưu nhiều tickets với error handling
 */
export async function saveTicketsToFirestore(tickets: ProcessedTicket[]): Promise<void> {
  console.log(`Starting to save ${tickets.length} tickets...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const ticket of tickets) {
    try {
      await saveTicketToFirestore(ticket);
      successCount++;
      console.log(`Progress: ${successCount}/${tickets.length} tickets saved`);
    } catch (error) {
      errorCount++;
      console.error(`Failed to save ticket ${ticket.id}:`, error);
      
      // Dừng nếu có quá nhiều lỗi liên tiếp
      if (errorCount >= 3 && successCount === 0) {
        console.error('Too many consecutive errors, stopping...');
        break;
      }
    }
  }
  
  console.log(`Save completed: ${successCount} success, ${errorCount} errors`);
}