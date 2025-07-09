'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, where, limit, startAfter, DocumentSnapshot, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Icon } from '@iconify/react';
import { ProcessedTicket } from '@/types';

interface FilterState {
  createDate: { start: string; end: string };
  ownerName: string;
  sourceType: string;
  supportObject: string;
  search: string;
}

interface SortState {
  field: keyof ProcessedTicket;
  direction: 'asc' | 'desc';
}

const ITEMS_PER_PAGE = 20;

/**
 * Trang hiển thị dữ liệu tickets từ Firebase
 */
export default function DataPage() {
  const [tickets, setTickets] = useState<ProcessedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [pageHistory, setPageHistory] = useState<DocumentSnapshot[]>([]);
  
  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    createDate: { start: '', end: '' },
    ownerName: '',
    sourceType: '',
    supportObject: '',
    search: ''
  });
  
  // Sort state
  const [sort, setSort] = useState<SortState>({
    field: 'createDate',
    direction: 'desc'
  });
  
  // Unique values for filter dropdowns
  const [uniqueValues, setUniqueValues] = useState({
    ownerNames: [] as string[],
    sourceTypes: [] as string[],
    supportObjects: [] as string[]
  });

  /**
   * Tạo base query Firebase với filters tối ưu
   */
  const buildBaseQuery = () => {
    let q = query(collection(db, 'support_tickets'));
    
    // Chỉ áp dụng một filter chính để tránh composite index
    // Ưu tiên filter theo thứ tự: createDate > ownerName > sourceType > supportObject
    if (filters.createDate.start || filters.createDate.end) {
      if (filters.createDate.start) {
        q = query(q, where('createDate', '>=', filters.createDate.start));
      }
      if (filters.createDate.end) {
        q = query(q, where('createDate', '<=', filters.createDate.end));
      }
    } else if (filters.ownerName) {
      q = query(q, where('ownerName', '==', filters.ownerName));
    } else if (filters.sourceType) {
      q = query(q, where('sourceType', '==', filters.sourceType));
    } else if (filters.supportObject) {
      q = query(q, where('supportObject', '==', filters.supportObject));
    }
    
    return q;
  };

  /**
   * Tạo query Firebase với pagination tối ưu - tránh composite index
   */
  const buildPaginatedQuery = (pageDirection: 'next' | 'prev' | 'first' = 'first') => {
    let q = buildBaseQuery();
    
    // Chỉ áp dụng orderBy khi không có filter where, hoặc sử dụng cùng trường
    const hasDateFilter = filters.createDate.start || filters.createDate.end;
    const hasOtherFilter = filters.ownerName || filters.sourceType || filters.supportObject;
    
    if (hasDateFilter && sort.field === 'createDate') {
      // Nếu filter theo createDate và sort theo createDate - OK
      q = query(q, orderBy(sort.field, sort.direction));
    } else if (!hasDateFilter && !hasOtherFilter) {
      // Không có filter nào - có thể sort bất kỳ trường nào
      q = query(q, orderBy(sort.field, sort.direction));
    } else if (hasOtherFilter && (sort.field === 'ownerName' || sort.field === 'sourceType' || sort.field === 'supportObject')) {
      // Nếu filter theo trường khác và sort theo cùng trường đó
      if ((filters.ownerName && sort.field === 'ownerName') ||
          (filters.sourceType && sort.field === 'sourceType') ||
          (filters.supportObject && sort.field === 'supportObject')) {
        q = query(q, orderBy(sort.field, sort.direction));
      } else {
        // Không thể sort theo trường khác - chỉ lấy dữ liệu và sort ở client
        // Không thêm orderBy để tránh composite index
      }
    } else {
      // Trường hợp khác - không thêm orderBy để tránh lỗi
      // Sort sẽ được thực hiện ở client-side
    }
    
    // Apply pagination
    if (pageDirection === 'next' && lastDoc) {
      q = query(q, startAfter(lastDoc), limit(ITEMS_PER_PAGE));
    } else if (pageDirection === 'prev' && pageHistory.length > 0) {
      const prevDoc = pageHistory[pageHistory.length - 1];
      q = query(q, startAfter(prevDoc), limit(ITEMS_PER_PAGE));
    } else {
      q = query(q, limit(ITEMS_PER_PAGE));
    }
    
    return q;
  };

  /**
   * Lấy tổng số tickets từ Firebase
   */
  const getTotalCount = useCallback(async () => {
    try {
      const q = buildBaseQuery();
      const snapshot = await getCountFromServer(q);
      const count = snapshot.data().count;
      setTotalCount(count);
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error getting total count:', error);
      setTotalCount(0);
      setTotalPages(1);
    }
  }, [filters]);

  /**
   * Load tickets với pagination và client-side filtering tối ưu
   */
  const loadTickets = useCallback(async (pageDirection: 'next' | 'prev' | 'first' = 'first') => {
    setLoading(true);
    
    try {
      const q = buildPaginatedQuery(pageDirection);
      const snapshot = await getDocs(q);
      const ticketsData: ProcessedTicket[] = [];
      const docs = snapshot.docs;
      
      docs.forEach((doc) => {
        const data = doc.data() as ProcessedTicket;
        ticketsData.push({ ...data, id: doc.id });
      });
      
      // Apply tất cả filters còn lại ở client-side
      const filteredTickets = ticketsData.filter(ticket => {
        // Date filter (nếu chưa áp dụng ở server)
        if (!filters.createDate.start && !filters.createDate.end) {
          // Date filter đã được áp dụng ở server, skip
        } else {
          if (filters.createDate.start && ticket.createDate < filters.createDate.start) return false;
          if (filters.createDate.end && ticket.createDate > filters.createDate.end) return false;
        }
        
        // Owner filter (áp dụng client-side nếu chưa áp dụng ở server)
        if (filters.ownerName && !(filters.createDate.start || filters.createDate.end)) {
          // Đã áp dụng ở server, skip
        } else if (filters.ownerName && ticket.ownerName !== filters.ownerName) {
          return false;
        }
        
        // Source type filter (áp dụng client-side nếu chưa áp dụng ở server)
        if (filters.sourceType && 
            !(filters.createDate.start || filters.createDate.end || filters.ownerName) && 
            ticket.sourceType !== filters.sourceType) {
          // Đã áp dụng ở server, skip
        } else if (filters.sourceType && 
                   (filters.createDate.start || filters.createDate.end || filters.ownerName) && 
                   ticket.sourceType !== filters.sourceType) {
          return false;
        }
        
        // Support object filter (áp dụng client-side nếu chưa áp dụng ở server)
        if (filters.supportObject && 
            !(filters.createDate.start || filters.createDate.end || filters.ownerName || filters.sourceType) && 
            ticket.supportObject !== filters.supportObject) {
          // Đã áp dụng ở server, skip
        } else if (filters.supportObject && 
                   (filters.createDate.start || filters.createDate.end || filters.ownerName || filters.sourceType) && 
                   ticket.supportObject !== filters.supportObject) {
          return false;
        }
        
        // Search filter (luôn áp dụng client-side)
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          return ticket.subject.toLowerCase().includes(searchLower) ||
                 ticket.ticketId.toLowerCase().includes(searchLower) ||
                 ticket.companyName.toLowerCase().includes(searchLower);
        }
        
        return true;
      });
      
      setTickets(filteredTickets);
      
      // Update pagination state
      if (docs.length > 0) {
        const lastDocument = docs[docs.length - 1];
        
        if (pageDirection === 'next') {
          // Save current lastDoc to history for prev navigation
          if (lastDoc) {
            setPageHistory(prev => [...prev, lastDoc]);
          }
          setLastDoc(lastDocument);
        } else if (pageDirection === 'prev') {
          // Remove last item from history and set new lastDoc
          setPageHistory(prev => {
            const newHistory = [...prev];
            newHistory.pop();
            return newHistory;
          });
          setLastDoc(lastDocument);
        } else if (pageDirection === 'first') {
          // Reset pagination state
          setLastDoc(lastDocument);
          setPageHistory([]);
        }
      }
      
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, sort, lastDoc, pageHistory]);

  /**
   * Load tickets khi filters hoặc sort thay đổi
   */
  useEffect(() => {
    setCurrentPage(1);
    setPageHistory([]);
    loadTickets('first');
    getTotalCount();
  }, [loadTickets, getTotalCount]);

  /**
   * Load unique values cho filter dropdowns
   */
  useEffect(() => {
    const q = query(collection(db, 'support_tickets'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ownerNames = new Set<string>();
      const sourceTypes = new Set<string>();
      const supportObjects = new Set<string>();
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as ProcessedTicket;
        if (data.ownerName) ownerNames.add(data.ownerName);
        if (data.sourceType) sourceTypes.add(data.sourceType);
        if (data.supportObject) supportObjects.add(data.supportObject);
      });
      
      setUniqueValues({
        ownerNames: Array.from(ownerNames).sort(),
        sourceTypes: Array.from(sourceTypes).sort(),
        supportObjects: Array.from(supportObjects).sort()
      });
    });
    
    return () => unsubscribe();
  }, []);

  /**
   * Handle sort change
   */
  const handleSort = (field: keyof ProcessedTicket) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (key: keyof FilterState, value: string | { start: string; end: string }) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      createDate: { start: '', end: '' },
      ownerName: '',
      sourceType: '',
      supportObject: '',
      search: ''
    });
  };

  /**
   * Handle pagination
   */
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      loadTickets('next');
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      loadTickets('prev');
    }
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
    setPageHistory([]);
    loadTickets('first');
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Icon icon="solar:database-bold" className="text-blue-600" />
            Dữ liệu Support Tickets
          </h1>
          <p className="text-gray-600">
            Hiển thị {totalCount > 0 ? `${totalCount} tickets` : 'tất cả tickets'} từ Firebase với phân trang
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon icon="solar:filter-bold" className="text-purple-600" />
            Bộ lọc
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Subject, Ticket ID, Company..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                value={filters.createDate.start}
                onChange={(e) => handleFilterChange('createDate', { ...filters.createDate, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                value={filters.createDate.end}
                onChange={(e) => handleFilterChange('createDate', { ...filters.createDate, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Owner Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <select
                value={filters.ownerName}
                onChange={(e) => handleFilterChange('ownerName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                {uniqueValues.ownerNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            
            {/* Source Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Type</label>
              <select
                value={filters.sourceType}
                onChange={(e) => handleFilterChange('sourceType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                {uniqueValues.sourceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            {/* Support Object */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Object</label>
              <select
                value={filters.supportObject}
                onChange={(e) => handleFilterChange('supportObject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                {uniqueValues.supportObjects.map(obj => (
                  <option key={obj} value={obj}>{obj}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Clear Filters Button */}
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Icon icon="solar:refresh-bold" />
            Xóa bộ lọc
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Danh sách Tickets (Trang {currentPage}/{totalPages} - {tickets.length} kết quả hiện tại)
              </h3>
              {loading && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Icon icon="solar:refresh-bold" className="animate-spin" />
                  Đang tải...
                </div>
              )}
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { key: 'ticketId', label: 'Ticket ID' },
                    { key: 'subject', label: 'Subject' },
                    { key: 'ownerName', label: 'Owner' },
                    { key: 'companyName', label: 'Company' },
                    { key: 'sourceType', label: 'Source' },
                    { key: 'supportObject', label: 'Support Object' },
                    { key: 'pipelineStageLabel', label: 'Stage' },
                    { key: 'createDate', label: 'Created' }
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort(key as keyof ProcessedTicket)}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        {sort.field === key && (
                          <Icon 
                            icon={sort.direction === 'asc' ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'} 
                            className="text-blue-600" 
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {ticket.ticketId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {ticket.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.ownerName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {ticket.companyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {ticket.sourceType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.supportObject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {ticket.pipelineStageLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ticket.createDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Empty State */}
          {!loading && tickets.length === 0 && (
            <div className="text-center py-12">
              <Icon icon="solar:database-bold" className="mx-auto text-gray-400 text-6xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
              <p className="text-gray-500">Không tìm thấy tickets nào phù hợp với bộ lọc hiện tại.</p>
            </div>
          )}
        </div>
        
        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white px-6 py-4 rounded-lg shadow-md">
            <div className="text-sm text-gray-700">
              Hiển thị trang {currentPage} / {totalPages} 
              {totalCount > 0 && (
                <span className="ml-2 text-gray-500">
                  (Tổng cộng: {totalCount} tickets)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleFirstPage}
                disabled={currentPage === 1 || loading}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Icon icon="solar:double-alt-arrow-left-bold" />
                Đầu
              </button>
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1 || loading}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Icon icon="solar:arrow-left-bold" />
                Trước
              </button>
              
              <span className="px-4 py-2 text-sm font-medium text-gray-700">
                {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages || loading}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Tiếp
                <Icon icon="solar:arrow-right-bold" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}