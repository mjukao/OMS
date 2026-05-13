<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '../stores/user.store'
import type { Address } from '../types/user.type'

const userStore = useUserStore()
const profileSaved = ref(false)

const profileForm = ref({
    firstName: '',
    lastName: '',
    phone: '',
})

const profilePhoneError = ref('')
const addrPhoneError = ref('')

const showAddrModal = ref(false)
const editingAddr = ref<Address | null>(null)
const addrForm = ref({
    label: '',
    fullName: '',
    phone: '',
    address: '',
    isDefault: false,
})

// ── validate เบอร์โทร ─────────────────────────────────
function validatePhone(phone: string): string {
    if (!phone) return ''
    if (!/^0/.test(phone)) return 'ลองอีกครั้ง'
    if (!/^\d+$/.test(phone)) return 'ลองอีกครั้ง'
    if (phone.length < 9 || phone.length > 10) return 'ลองอีกครั้ง'
    return ''
}

// กรองให้ใส่ได้แค่ตัวเลข
function onPhoneInput(e: Event, target: 'profile' | 'addr') {
    const input = e.target as HTMLInputElement
    // เอาเฉพาะตัวเลข
    const digits = input.value.replace(/\D/g, '').slice(0, 10)
    input.value = digits
    if (target === 'profile') {
        profileForm.value.phone = digits
        profilePhoneError.value = validatePhone(digits)
    } else {
        addrForm.value.phone = digits
        addrPhoneError.value = validatePhone(digits)
    }
}

onMounted(async () => {
    await userStore.fetchProfile()
    if (userStore.profile) {
        profileForm.value.firstName = userStore.profile.firstName ?? ''
        profileForm.value.lastName = userStore.profile.lastName ?? ''
        profileForm.value.phone = userStore.profile.phone ?? ''
    }
})

async function saveProfile() {
    profilePhoneError.value = validatePhone(profileForm.value.phone)
    if (profilePhoneError.value) return
    await userStore.updateProfile(profileForm.value)
    profileSaved.value = true
    setTimeout(() => (profileSaved.value = false), 2000)
}

function openAddAddr() {
    editingAddr.value = null
    addrForm.value = { label: '', fullName: '', phone: '', address: '', isDefault: false }
    addrPhoneError.value = ''
    showAddrModal.value = true
}

function openEditAddr(addr: Address) {
    editingAddr.value = addr
    addrForm.value = {
        label: addr.label,
        fullName: addr.fullName,
        phone: addr.phone,
        address: addr.address,
        isDefault: addr.isDefault,
    }
    addrPhoneError.value = ''
    showAddrModal.value = true
}

const canSaveAddr = computed(() =>
    addrForm.value.label &&
    addrForm.value.fullName &&
    addrForm.value.phone &&
    addrForm.value.address &&
    !addrPhoneError.value
)

async function saveAddr() {
    addrPhoneError.value = validatePhone(addrForm.value.phone)
    if (addrPhoneError.value) return
    if (editingAddr.value) {
        await userStore.updateAddress(editingAddr.value._id, addrForm.value)
    } else {
        await userStore.addAddress(addrForm.value)
    }
    showAddrModal.value = false
}

async function removeAddr(addrId: string) {
    if (!confirm('ยืนยันการลบที่อยู่?')) return
    await userStore.deleteAddress(addrId)
}

async function setDefault(addrId: string) {
    await userStore.setDefaultAddress(addrId)
}
</script>

<template>
    <div class="page">

        <div class="section-header">
            <h1>โปรไฟล์ของฉัน</h1>
        </div>

        <div v-if="userStore.loading" class="loading">กำลังโหลด...</div>
        <div v-else-if="userStore.error" class="alert alert-error">{{ userStore.error }}</div>

        <template v-else-if="userStore.profile">

            <!-- ข้อมูล user -->
            <div class="form-box" style="display:flex;gap:16px;align-items:center;margin-bottom:20px">
                <img :src="userStore.profile.avatar || `https://ui-avatars.com/api/?name=${userStore.profile.name}&background=7837ee&color=fff`"
                    style="width:64px;height:64px;border-radius:50%;object-fit:cover" />
                <div>
                    <div style="font-weight:600;font-size:16px">{{ userStore.profile.name }}</div>
                    <div style="font-size:13px;color:#6b7280">{{ userStore.profile.email }}</div>
                    <span class="badge badge-green" style="margin-top:4px">{{ userStore.profile.role }}</span>
                </div>
            </div>

            <!-- แก้ไขโปรไฟล์ -->
            <div class="form-box">
                <h3>ข้อมูลส่วนตัว</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>ชื่อ</label>
                        <input v-model="profileForm.firstName" type="text" placeholder="ชื่อ" />
                    </div>
                    <div class="form-group">
                        <label>นามสกุล</label>
                        <input v-model="profileForm.lastName" type="text" placeholder="นามสกุล" />
                    </div>
                </div>
                <div class="form-group">
                    <label>เบอร์โทรศัพท์</label>
                    <input :value="profileForm.phone" type="text" placeholder="0812345678" maxlength="10"
                        inputmode="numeric" :style="profilePhoneError ? 'border-color:#ef4444' : ''"
                        @input="onPhoneInput($event, 'profile')" />
                    <div v-if="profilePhoneError" class="txt-error" style="margin-top:4px;font-size:12px">
                        {{ profilePhoneError }}
                    </div>
                    <div style="font-size:11px;color:#9ca3af;margin-top:3px">
                        ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn-save" :disabled="userStore.loading || !!profilePhoneError" @click="saveProfile">
                        {{ userStore.loading ? 'กำลังบันทึก...' : 'บันทึก' }}
                    </button>
                    <span v-if="profileSaved" style="color:#16a34a;font-size:13px;margin-left:8px">✓ บันทึกแล้ว</span>
                </div>
            </div>

            <!-- ที่อยู่ -->
            <div class="form-box">
                <div class="section-header" style="margin-bottom:12px">
                    <h3 style="margin:0">ที่อยู่จัดส่ง</h3>
                    <button class="btn-add" @click="openAddAddr">+ เพิ่มที่อยู่</button>
                </div>

                <div v-if="userStore.profile.addresses.length === 0" class="txt-gray">
                    ยังไม่มีที่อยู่
                </div>

                <div v-for="addr in userStore.profile.addresses" :key="addr._id"
                    :class="['addr-card', addr.isDefault ? 'addr-default' : '']">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start">
                        <div>
                            <div style="font-weight:500;font-size:13px">
                                {{ addr.label }}
                                <span v-if="addr.isDefault" class="badge badge-green"
                                    style="margin-left:6px">หลัก</span>
                            </div>
                            <div style="font-size:13px;color:#374151;margin-top:2px">{{ addr.fullName }} | {{ addr.phone
                            }}</div>
                            <div style="font-size:12px;color:#6b7280;margin-top:2px">{{ addr.address }}</div>
                        </div>
                        <div class="action-btns">
                            <button v-if="!addr.isDefault" class="btn-sm btn-sm-view"
                                @click="setDefault(addr._id)">ตั้งเป็นหลัก</button>
                            <button class="btn-sm btn-sm-edit" @click="openEditAddr(addr)">แก้ไข</button>
                            <button class="btn-sm btn-sm-delete" @click="removeAddr(addr._id)">ลบ</button>
                        </div>
                    </div>
                </div>
            </div>

        </template>

        <!-- Modal เพิ่ม/แก้ไขที่อยู่ -->
        <div v-if="showAddrModal" class="modal-backdrop" @click.self="showAddrModal = false">
            <div class="modal">
                <h2>{{ editingAddr ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่' }}</h2>

                <div class="form-group">
                    <label>ชื่อที่อยู่ (เช่น บ้าน, ที่ทำงาน)</label>
                    <input v-model="addrForm.label" type="text" placeholder="บ้าน" />
                </div>
                <div class="form-group">
                    <label>ชื่อผู้รับ</label>
                    <input v-model="addrForm.fullName" type="text" placeholder="ชื่อผู้รับ" />
                </div>
                <div class="form-group">
                    <label>เบอร์โทร</label>
                    <input :value="addrForm.phone" type="text" placeholder="0812345678" maxlength="10"
                        inputmode="numeric" :style="addrPhoneError ? 'border-color:#ef4444' : ''"
                        @input="onPhoneInput($event, 'addr')" />
                    <div v-if="addrPhoneError" class="txt-error" style="margin-top:4px;font-size:12px">
                        {{ addrPhoneError }}
                    </div>
                    <div style="font-size:11px;color:#9ca3af;margin-top:3px">
                        ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก
                    </div>
                </div>
                <div class="form-group">
                    <label>ที่อยู่</label>
                    <textarea v-model="addrForm.address" rows="3"
                        placeholder="บ้านเลขที่ ถนน อำเภอ จังหวัด รหัสไปรษณีย์"
                        style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:4px;font-size:13px;resize:vertical"></textarea>
                </div>
                <div class="form-group" style="display:flex;align-items:center;gap:8px">
                    <input id="isDefault" v-model="addrForm.isDefault" type="checkbox" />
                    <label for="isDefault" style="margin:0;font-size:13px;color:#374151">ตั้งเป็นที่อยู่หลัก</label>
                </div>

                <div class="form-actions" style="justify-content:flex-end;gap:8px">
                    <button class="btn-cancel" @click="showAddrModal = false">ยกเลิก</button>
                    <button class="btn-save" :disabled="!canSaveAddr || userStore.loading" @click="saveAddr">
                        {{ userStore.loading ? 'กำลังบันทึก...' : 'บันทึก' }}
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
.addr-card {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px 14px;
    margin-bottom: 8px;
    background: #fff;
}

.addr-default {
    border-color: #16a34a;
    background: #f0fdf4;
}
</style>
