            {showCompanyAssign && (
              <div className="form-group mb-4" style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <label className="fw-bold mb-4 d-block" style={{ color: '#1e293b', fontSize: '16px', fontWeight: '700', letterSpacing: '-0.01em' }}>
                  Assign to Companies <span className="text-danger">*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {companyOptions.map((comp, idx) => {
                    const isSelected = selectedCompanies.includes(comp);
                    return (
                      <div key={idx} style={{
                        border: isSelected ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0',
                        padding: '20px',
                        borderRadius: '14px',
                        backgroundColor: isSelected ? '#f8fafc' : '#ffffff',
                        boxShadow: isSelected ? '0 10px 20px -5px rgba(59, 130, 246, 0.05)' : 'none',
                        transition: 'all 0.3s ease',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!isGroupAdmin && !isCompanyAdmin}
                            onChange={(e) => {
                              const globalTags = ['All', 'all', 'Global', 'global', 'POS 8', 'pos 8', 'pos8'];
                              const isGlobal = (c) => globalTags.includes(c);

                              if (e.target.checked) {
                                if (isGlobal(comp)) {
                                  setSelectedCompanies([comp]);
                                  setCompanyPrices({ [comp]: companyPrices[comp] || "" });
                                } else {
                                  setSelectedCompanies(prev => prev.filter(c => !isGlobal(c)).concat(comp));
                                  setCompanyPrices(prev => {
                                    const next = { ...prev };
                                    globalTags.forEach(gt => delete next[gt]);
                                    return next;
                                  });
                                }
                              } else {
                                setSelectedCompanies(prev => prev.filter(c => c !== comp));
                                setCompanyPrices(prev => {
                                  const newPrices = { ...prev };
                                  delete newPrices[comp];
                                  return newPrices;
                                });
                              }
                            }}
                            id={`comp-${idx}`}
                            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#3b82f6' }}
                          />
                          <label htmlFor={`comp-${idx}`} style={{ margin: 0, fontWeight: '700', color: '#1e293b', cursor: 'pointer', fontSize: '15px' }}>
                            {comp}
                          </label>
                        </div>
                        {isSelected && (
                          <div style={{ marginTop: '12px' }}>
                            <label style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px', fontSize: '13px' }}>
                              Price Override ({getCompanyDisplaySymbol(comp)})
                            </label>
                            <input
                              type="number"
                              className="input"
                              placeholder={`Base: ${formData.price_list_rate || 0}`}
                              value={companyPrices[comp] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCompanyPrices(prev => ({
                                  ...prev,
                                  [comp]: val === '' ? undefined : Number(val)
                                }));
                              }}
                              style={{
                                padding: '10px',
                                fontSize: '13px',
                                width: '100%',
                                border: companyPrices[comp] ? '1.5px solid #3b82f6' : '1.5px solid #cbd5e1',
                                borderRadius: '8px',
                                backgroundColor: companyPrices[comp] ? '#f0f9ff' : '#fff'
                              }}
                              min="0"
                              step="0.01"
                              onWheel={disableNumberInputScroll}
                            />
                          </div>
                        )}
                        {isSelected && !userBranch && companyBranchesMap[comp] && companyBranchesMap[comp].length > 0 && (
                          <div style={{ marginTop: '20px', paddingLeft: '15px', borderLeft: '2.5px solid #3b82f6' }}>
                            <h6 style={{ fontSize: '13px', color: '#1e293b', marginBottom: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              Branches in {comp}
                            </h6>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                              {companyBranchesMap[comp].map((branch, bIdx) => {
                                const isBranchSelected = branchNames.includes(branch);
                                return (
                                  <div key={bIdx} style={{ padding: '10px 14px', backgroundColor: isBranchSelected ? '#f0fdf4' : '#f8fafc', borderRadius: '8px', border: isBranchSelected ? '1.5px solid #10b981' : '1.5px solid #e2e8f0', transition: 'all 0.2s ease' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <input
                                        type="checkbox"
                                        checked={isBranchSelected}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setBranchNames(prev => [...prev, branch]);
                                          } else {
                                            setBranchNames(prev => prev.filter(b => b !== branch));
                                            setBranchPrices(prev => {
                                              const newPrices = { ...prev };
                                              delete newPrices[branch];
                                              return newPrices;
                                            });
                                          }
                                        }}
                                        id={`branch-${idx}-${bIdx}`}
                                        style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                                      />
                                      <label htmlFor={`branch-${idx}-${bIdx}`} style={{ margin: 0, fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#334155' }}>
                                        {branch}
                                      </label>
                                    </div>
                                    {isBranchSelected && (
                                      <div style={{ marginTop: '8px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                          Price Override ({getCompanyDisplaySymbol(null, branch)})
                                        </label>
                                        <input
                                          type="number"
                                          className="input"
                                          placeholder={`Base: ${formData.price_list_rate || 0}`}
                                          value={branchPrices[branch] || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setBranchPrices(prev => ({
                                              ...prev,
                                              [branch]: val === '' ? null : Number(val)
                                            }));
                                          }}
                                          style={{ padding: '8px', fontSize: '12px', width: '100%', border: branchPrices[branch] ? '1.5px solid #10b981' : '1.5px solid #cbd5e1', borderRadius: '6px', backgroundColor: branchPrices[branch] ? '#f0fdf4' : '#fff' }}
                                          min="0"
                                          step="0.01"
                                          onWheel={disableNumberInputScroll}
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
